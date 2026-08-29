import { prisma } from "@autocloud/db";
import { setEnvVarRequestSchema } from "@autocloud/shared";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, notFound, ok } from "@/lib/api/respond";
import { listEnvVars, setEnvVar } from "@/lib/services/envvars";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "env:read");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");
    // Nunca retorna valores — apenas chaves e metadados.
    return ok({ envVars: await listEnvVars(project.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "env:write");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");
    const body = setEnvVarRequestSchema.parse(await request.json());
    await setEnvVar({
      projectId: project.id,
      organizationId: auth.organization.id,
      userId: auth.user.id,
      key: body.key,
      value: body.value,
      target: body.target,
    });
    return ok({ saved: true, key: body.key }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
