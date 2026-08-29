import { prisma } from "@autocloud/db";
import Link from "next/link";
import { AdminTable, Stat } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { requireStaff } from "@/lib/auth/staff";
import { formatDuration, timeAgo } from "@/lib/format";

export default async function AdminDeploymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff("deployments");
  const { status } = await searchParams;
  const failedFilter = status === "failed";

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [deployments, total24h, failed24h, avgDuration] = await Promise.all([
    prisma.deployment.findMany({
      where: failedFilter
        ? { status: { in: ["ANALYSIS_FAILED", "BUILD_FAILED", "DEPLOY_FAILED"] } }
        : undefined,
      include: { project: { include: { organization: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.deployment.count({ where: { createdAt: { gte: since24h } } }),
    prisma.deployment.count({
      where: {
        createdAt: { gte: since24h },
        status: { in: ["ANALYSIS_FAILED", "BUILD_FAILED", "DEPLOY_FAILED"] },
      },
    }),
    prisma.deployment.aggregate({
      where: { createdAt: { gte: since24h }, durationMs: { not: null } },
      _avg: { durationMs: true },
    }),
  ]);

  const successRate =
    total24h > 0 ? Math.round(((total24h - failed24h) / total24h) * 1000) / 10 : null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-medium">Deployments</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/deployments"
            className={`rounded-md px-3 py-1.5 ${!failedFilter ? "bg-panel-2 text-ink" : "text-ink-dim"}`}
          >
            All
          </Link>
          <Link
            href="/admin/deployments?status=failed"
            className={`rounded-md px-3 py-1.5 ${failedFilter ? "bg-panel-2 text-ink" : "text-ink-dim"}`}
          >
            Failed
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat label="Deployments (24h)" value={String(total24h)} />
        <Stat
          label="Success rate (24h)"
          value={successRate === null ? "No data" : `${successRate}%`}
        />
        <Stat
          label="Avg duration (24h)"
          value={
            avgDuration._avg.durationMs === null
              ? "No data"
              : formatDuration(Math.round(avgDuration._avg.durationMs))
          }
        />
      </div>

      <AdminTable
        headers={["Deployment", "Customer / Project", "Status", "Duration", "When"]}
        empty={deployments.length === 0}
      >
        {deployments.map((deployment) => (
          <tr key={deployment.id} className="border-b border-edge-soft last:border-0">
            <td className="px-4 py-2.5 font-mono text-xs">{deployment.id.slice(-12)}</td>
            <td className="px-4 py-2.5 text-xs">
              <Link
                href={`/admin/customers/${deployment.project.organizationId}`}
                className="text-ink-faint hover:text-ink"
              >
                {deployment.project.organization.name}
              </Link>
              <p>{deployment.project.name}</p>
            </td>
            <td className="px-4 py-2.5">
              <StatusBadge status={deployment.status} />
              {deployment.error ? (
                <p className="mt-1 max-w-sm truncate text-xs text-err">{deployment.error}</p>
              ) : null}
            </td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {formatDuration(deployment.durationMs)}
            </td>
            <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(deployment.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
