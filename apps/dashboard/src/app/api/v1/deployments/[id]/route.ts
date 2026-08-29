import { prisma } from "@autocloud/db";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, notFound, ok } from "@/lib/api/respond";
import { toDeploymentResponse } from "@/lib/services/deployments";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "deployments:read");
    const { id } = await params;
    const deployment = await prisma.deployment.findFirst({
      where: { id, project: { organizationId: auth.organization.id } },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
    if (!deployment) throw notFound("Deployment");
    return ok({
      deployment: toDeploymentResponse(deployment),
      events: deployment.events.map((e) => ({
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        message: e.message,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
