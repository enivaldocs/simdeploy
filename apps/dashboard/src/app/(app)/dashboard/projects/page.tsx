import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getSession } from "@/lib/auth/session";
import { formatUsd, timeAgo } from "@/lib/format";
import { listProjects } from "@/lib/services/projects";
import { NewProjectForm } from "./new-project-form";

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session) return null;
  const projects = await listProjects(session.organization.id);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-medium">Projects</h1>
        <NewProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-edge bg-panel p-8 text-center">
          <p className="mb-2 text-ink-dim">Nenhum projeto ainda.</p>
          <p className="font-mono text-sm text-ink-faint">
            npx autocloud deploy — ou crie um projeto aqui e faça o deploy pela CLI.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-lg border border-edge bg-panel p-5 transition-colors hover:border-accent/60"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-medium">{project.name}</h2>
                  <p className="font-mono text-xs text-ink-faint">
                    {project.defaultDomain ?? project.slug}
                  </p>
                </div>
                {project.latestDeployment ? (
                  <StatusBadge status={project.latestDeployment.status} />
                ) : (
                  <span className="text-xs text-ink-faint">no deploys</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span className="font-mono">{project.framework ?? "framework?"}</span>
                <span>
                  {project.estimatedMonthlyUsd !== null
                    ? `${formatUsd(project.estimatedMonthlyUsd)}/mo est.`
                    : "sem estimativa"}
                </span>
                <span>
                  {project.latestDeployment ? timeAgo(project.latestDeployment.createdAt) : "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
