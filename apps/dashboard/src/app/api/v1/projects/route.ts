import { prisma } from "@simdeploy/db";
import { createProjectRequestSchema } from "@simdeploy/shared";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/respond";
import {
  createProject,
  listProjects,
  projectInclude,
  toProjectResponse,
} from "@/lib/services/projects";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "projects:read");
    return ok({ projects: await listProjects(auth.organization.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "projects:write");
    const body = createProjectRequestSchema.parse(await request.json());
    const project = await createProject({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      name: body.name,
      gitRepoUrl: body.gitRepoUrl,
    });
    const full = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: projectInclude,
    });
    return ok({ project: toProjectResponse(full) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
