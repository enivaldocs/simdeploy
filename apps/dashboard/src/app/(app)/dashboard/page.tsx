import { prisma } from "@autocloud/db";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getSession } from "@/lib/auth/session";
import { formatDuration, formatUsd, timeAgo } from "@/lib/format";

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.organization.id;

  const [
    projectCount,
    deploymentCount,
    readyCount,
    failedCount,
    recentDeployments,
    latestEstimates,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId: orgId } }),
    prisma.deployment.count({ where: { project: { organizationId: orgId } } }),
    prisma.deployment.count({
      where: { project: { organizationId: orgId }, status: "READY" },
    }),
    prisma.deployment.count({
      where: {
        project: { organizationId: orgId },
        status: { in: ["ANALYSIS_FAILED", "BUILD_FAILED", "DEPLOY_FAILED"] },
      },
    }),
    prisma.deployment.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.costEstimate.findMany({
      where: { project: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
      distinct: ["projectId"],
    }),
  ]);

  const estimatedTotal = latestEstimates.reduce((sum, e) => sum + Number(e.monthlyUsd), 0);

  const stats = [
    { label: "Projects", value: String(projectCount) },
    { label: "Deployments", value: String(deploymentCount) },
    { label: "Ready", value: String(readyCount) },
    { label: "Failed", value: String(failedCount) },
    {
      label: "Estimated monthly cost",
      value: formatUsd(estimatedTotal),
      hint: "projeção por tabelas de preço",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-medium">Overview</h1>
        <Link
          href="/dashboard/projects"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:bg-accent-dim"
        >
          New project
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-edge bg-panel p-4">
            <p className="text-xs text-ink-faint">{stat.label}</p>
            <p className="mt-1 font-mono text-xl">{stat.value}</p>
            {stat.hint ? <p className="mt-1 text-[11px] text-ink-faint">{stat.hint}</p> : null}
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Recent deployments</h2>
      <div className="overflow-hidden rounded-lg border border-edge">
        {recentDeployments.length === 0 ? (
          <p className="bg-panel p-6 text-sm text-ink-faint">
            Nenhum deployment ainda. Rode{" "}
            <span className="font-mono text-ink-dim">autocloud deploy</span> em um projeto para
            começar.
          </p>
        ) : (
          <table className="w-full bg-panel text-sm">
            <tbody>
              {recentDeployments.map((deployment) => (
                <tr key={deployment.id} className="border-b border-edge-soft last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/deployments/${deployment.id}`}
                      className="font-medium hover:text-accent"
                    >
                      {deployment.project.name}
                    </Link>
                    <p className="font-mono text-xs text-ink-faint">
                      {deployment.commitSha?.slice(0, 7) ?? deployment.trigger}
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
    </div>
  );
}
