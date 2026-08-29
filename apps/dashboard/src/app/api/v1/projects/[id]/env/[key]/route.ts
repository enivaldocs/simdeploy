import { prisma } from "@autocloud/db";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, notFound, ok } from "@/lib/api/respond";
import { deleteEnvVar } from "@/lib/services/envvars";

type Params = { params: Promise<{ id: string; key: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "env:write");
    const { id, key } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");
    const count = await deleteEnvVar({
      projectId: project.id,
      organizationId: auth.organization.id,
      userId: auth.user.id,
      key,
    });
    if (count === 0) throw notFound("Variável");
    return ok({ deleted: true, key });
  } catch (error) {
    return handleApiError(error);
  }
}
