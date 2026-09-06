import { prisma } from "@simdeploy/db";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, notFound, ok } from "@/lib/api/respond";

type Params = { params: Promise<{ id: string }> };

/**
 * Logs de deployment em formato amigável para agentes: JSON estruturado por
 * default; ?format=text devolve texto plano legível.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "logs:read");
    const { id } = await params;
    const deployment = await prisma.deployment.findFirst({
      where: { id, project: { organizationId: auth.organization.id } },
    });
    if (!deployment) throw notFound("Deployment");

    const stage = request.nextUrl.searchParams.get("stage") ?? undefined;
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 500), 2000);
    const logs = await prisma.logEntry.findMany({
      where: { deploymentId: deployment.id, ...(stage ? { stage } : {}) },
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    if (request.nextUrl.searchParams.get("format") === "text") {
      const text = logs
        .map(
          (l) =>
            `${l.timestamp.toISOString().slice(11, 19)} ${l.stage} ${l.level.toUpperCase()} ${l.message}`,
        )
        .join("\n");
      return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    return ok({
      deploymentId: deployment.id,
      status: deployment.status,
      logs: logs.map((l) => ({
        timestamp: l.timestamp.toISOString(),
        deploymentId: l.deploymentId,
        stage: l.stage,
        level: l.level,
        message: l.message,
        metadata: l.metadata,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
