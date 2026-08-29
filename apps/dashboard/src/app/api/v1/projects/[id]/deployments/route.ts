import { prisma } from "@autocloud/db";
import { createDeploymentMetaSchema } from "@autocloud/shared";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { apiError, HttpError, handleApiError, notFound, ok } from "@/lib/api/respond";
import { rateLimiters } from "@/lib/rate-limit";
import { runDeployment, toDeploymentResponse } from "@/lib/services/deployments";

type Params = { params: Promise<{ id: string }> };

const MAX_ARTIFACT_BYTES = 100 * 1024 * 1024;

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "deployments:read");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");
    const deployments = await prisma.deployment.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok({ deployments: deployments.map(toDeploymentResponse) });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Cria um deployment: multipart com campo "meta" (JSON CreateDeploymentMeta)
 * e campo "artifact" (tar.gz do build feito no cliente).
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "deployments:write");

    const deployLimit = rateLimiters().deploy.limit(`org:${auth.organization.id}`);
    if (!deployLimit.allowed) {
      throw new HttpError(429, "rate_limited", "Limite de deployments atingido. Aguarde.");
    }

    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");

    const form = await request.formData().catch(() => null);
    if (!form) return apiError(400, "invalid_multipart", "Esperado multipart/form-data.");

    const metaRaw = form.get("meta");
    if (typeof metaRaw !== "string") {
      return apiError(400, "missing_meta", "Campo 'meta' (JSON) ausente.");
    }
    const meta = createDeploymentMetaSchema.parse(JSON.parse(metaRaw));

    const artifact = form.get("artifact");
    if (!(artifact instanceof File)) {
      return apiError(400, "missing_artifact", "Campo 'artifact' (tar.gz) ausente.");
    }
    if (artifact.size === 0 || artifact.size > MAX_ARTIFACT_BYTES) {
      return apiError(413, "artifact_too_large", "Artefato vazio ou acima de 100MB.");
    }

    const deployment = await runDeployment({
      project,
      meta,
      artifact: Buffer.from(await artifact.arrayBuffer()),
      userId: auth.user.id,
    });
    return ok({ deployment: toDeploymentResponse(deployment) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
