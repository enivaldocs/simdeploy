import { prisma } from "@simdeploy/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { getSession } from "@/lib/auth/session";
import { formatDuration, formatUsd, timeAgo } from "@/lib/format";
import { listEnvVars } from "@/lib/services/envvars";
import { DeleteProjectButton } from "./delete-project-button";
import { EnvVarsPanel } from "./env-vars-panel";

const TABS = ["deployments", "environment", "settings"] as const;
type Tab = (typeof TABS)[number];

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "deployments";

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.organization.id },
    include: {
      domains: true,
      deployments: { orderBy: { createdAt: "desc" }, take: 30 },
      costEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) notFound();

  const latestReady = project.deployments.find((d) => d.status === "READY");
  const latestCost = project.costEstimates[0] ?? null;
  const envVars = await listEnvVars(project.id);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-2 text-xs text-ink-faint">
        <Link href="/dashboard/projects" className="hover:text-ink">
          Projects
        </Link>{" "}
        / {project.name}
      </div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium">{project.name}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-ink-dim">
            <span className="font-mono text-xs">{project.framework ?? "framework?"}</span>
            {latestReady?.url ? (
              <a
                href={latestReady.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-accent hover:underline"
              >
                {latestReady.url}
              </a>
            ) : (
              <span className="font-mono text-xs">
                {project.domains.find((d) => d.type === "SUBDOMAIN")?.hostname}
              </span>
            )}
            {latestCost ? (
              <span className="text-xs">
                {formatUsd(Number(latestCost.monthlyUsd))}/mo est. ({latestCost.provider}/
                {latestCost.architecture})
              </span>
            ) : null}
          </div>
        </div>
        {project.deployments[0] ? <StatusBadge status={project.deployments[0].status} /> : null}
      </div>

      <div className="mb-6 flex gap-1 border-b border-edge-soft">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/dashboard/projects/${project.id}?tab=${t}`}
            className={`border-b-2 px-4 py-2 text-sm capitalize ${
              tab === t
                ? "border-accent text-ink"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            {t === "environment" ? "Environment Variables" : t}
          </Link>
        ))}
      </div>

      {tab === "deployments" ? (
        <div className="overflow-hidden rounded-lg border border-edge">
          {project.deployments.length === 0 ? (
            <div className="bg-panel p-6 text-sm text-ink-faint">
              <p className="mb-2">Nenhum deployment. Na raiz do projeto, rode:</p>
              <pre className="rounded-md bg-panel-2 p-3 font-mono text-xs text-ink-dim">
                {`npx simdeploy deploy --yes`}
              </pre>
            </div>
          ) : (
            <table className="w-full bg-panel text-sm">
              <tbody>
                {project.deployments.map((deployment) => (
                  <tr key={deployment.id} className="border-b border-edge-soft last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/deployments/${deployment.id}`}
                        className="font-mono text-xs hover:text-accent"
                      >
                        {deployment.id.slice(-12)}
                      </Link>
                      <p className="text-xs text-ink-faint">
                        {deployment.commitMessage ?? `via ${deployment.trigger}`}
                        {deployment.branch ? ` · ${deployment.branch}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={deployment.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                      {formatDuration(deployment.durationMs)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ink-faint">
                      {timeAgo(deployment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {tab === "environment" ? <EnvVarsPanel projectId={project.id} envVars={envVars} /> : null}

      {tab === "settings" ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-edge bg-panel p-5">
            <h2 className="mb-3 text-sm font-medium">Project</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-ink-faint">Slug</dt>
              <dd className="font-mono text-xs">{project.slug}</dd>
              <dt className="text-ink-faint">Git repository</dt>
              <dd className="font-mono text-xs">{project.gitRepoUrl ?? "—"}</dd>
              <dt className="text-ink-faint">Created</dt>
              <dd className="text-xs">{project.createdAt.toISOString().slice(0, 10)}</dd>
            </dl>
          </div>
          <div className="rounded-lg border border-err/30 bg-panel p-5">
            <h2 className="mb-3 text-sm font-medium text-err">Danger zone</h2>
            <DeleteProjectButton projectId={project.id} name={project.name} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
