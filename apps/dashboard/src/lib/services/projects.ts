import { type Prisma, prisma } from "@simdeploy/db";
import type { ProjectResponse } from "@simdeploy/shared";
import { trackEvent } from "../analytics";
import { audit } from "../audit";

function slugifyProjectName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "project"
  );
}

async function uniqueProjectSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.project.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  throw new Error("Não foi possível gerar slug único de projeto");
}

export async function createProject(input: {
  organizationId: string;
  userId: string;
  name: string;
  gitRepoUrl?: string;
}) {
  const slug = await uniqueProjectSlug(slugifyProjectName(input.name));
  const project = await prisma.project.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      slug,
      gitRepoUrl: input.gitRepoUrl,
      environments: { create: [{ name: "production" }, { name: "preview" }] },
      domains: {
        // Subdomínio canônico do projeto. Em produção: <slug>.simdeploy.com;
        // no dev o provider local serve em /sites/<slug>/.
        create: { hostname: `${slug}.simdeploy.com`, type: "SUBDOMAIN", status: "ACTIVE" },
      },
    },
  });

  await audit({
    organizationId: input.organizationId,
    userId: input.userId,
    action: "project.create",
    resourceType: "project",
    resourceId: project.id,
    metadata: { name: input.name, slug },
  });
  await trackEvent({
    name: "project_created",
    userId: input.userId,
    organizationId: input.organizationId,
    properties: { projectId: project.id },
  });

  return project;
}

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    deployments: { take: 1; orderBy: { createdAt: "desc" } };
    costEstimates: { take: 1; orderBy: { createdAt: "desc" } };
    domains: true;
  };
}>;

export function toProjectResponse(project: ProjectWithRelations): ProjectResponse {
  const latest = project.deployments[0] ?? null;
  const latestCost = project.costEstimates[0] ?? null;
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    framework: project.framework,
    gitRepoUrl: project.gitRepoUrl,
    defaultDomain: project.domains.find((d) => d.type === "SUBDOMAIN")?.hostname ?? null,
    latestDeployment: latest
      ? {
          id: latest.id,
          status: latest.status,
          createdAt: latest.createdAt.toISOString(),
          url: latest.url,
        }
      : null,
    estimatedMonthlyUsd: latestCost ? Number(latestCost.monthlyUsd) : null,
    createdAt: project.createdAt.toISOString(),
  };
}

export const projectInclude = {
  deployments: { take: 1, orderBy: { createdAt: "desc" as const } },
  costEstimates: { take: 1, orderBy: { createdAt: "desc" as const } },
  domains: true,
};

export async function listProjects(organizationId: string): Promise<ProjectResponse[]> {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });
  return projects.map(toProjectResponse);
}
