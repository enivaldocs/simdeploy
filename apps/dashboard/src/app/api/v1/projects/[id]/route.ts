import { prisma } from "@simdeploy/db";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, notFound, ok } from "@/lib/api/respond";
import { audit } from "@/lib/audit";
import { projectInclude, toProjectResponse } from "@/lib/services/projects";
import { providerRegistry } from "@/lib/services/providers";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "projects:read");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
      include: projectInclude,
    });
    if (!project) throw notFound("Projeto");
    return ok({ project: toProjectResponse(project) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "projects:write");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");

    // Despublica no provider antes de apagar os registros.
    const registry = providerRegistry();
    for (const provider of registry.list()) {
      await provider
        .destroy({ projectSlug: project.slug, providerRef: `${provider.slug}:${project.slug}` })
        .catch(() => {});
    }
    await prisma.project.delete({ where: { id: project.id } });
    await audit({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "project.delete",
      resourceType: "project",
      resourceId: project.id,
      metadata: { slug: project.slug },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
