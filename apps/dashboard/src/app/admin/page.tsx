import { prisma } from "@autocloud/db";
import { formatMinor } from "@autocloud/finance";
import Link from "next/link";
import { moneyByCurrency, Stat } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { getOverviewMetrics } from "@/lib/admin/metrics";
import { requireStaff } from "@/lib/auth/staff";
import { timeAgo } from "@/lib/format";

export default async function AdminOverviewPage() {
  await requireStaff("overview");
  const m = await getOverviewMetrics();
  const recentDeployments = await prisma.deployment.findMany({
    include: { project: { include: { organization: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const marginValue = m.grossMargin
    ? `${formatMinor(m.grossMargin.profit.amountMinor, "BRL")}${
        m.grossMargin.marginPct !== null ? ` (${m.grossMargin.marginPct}%)` : ""
      }`
    : m.fxRateConfigured
      ? "R$ 0.00"
      : "Configure FX rate";

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-xl font-medium">Business overview</h1>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Revenue</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Revenue today" value={moneyByCurrency(m.revenueTodayByCurrency)} />
        <Stat label="Revenue this month" value={moneyByCurrency(m.revenueMonthByCurrency)} />
        <Stat label="MRR" value={moneyByCurrency(m.mrr)} />
        <Stat label="ARR" value={moneyByCurrency(m.arr)} />
        <Stat
          label="Gross margin (month)"
          value={marginValue}
          hint="revenue - custo ACTUAL de provider"
        />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Customers</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Customers" value={String(m.customers)} />
        <Stat label="Paid customers" value={String(m.paidCustomers)} />
        <Stat label="Trials" value={String(m.trials)} />
        <Stat
          label="Churn (month)"
          value={m.churnPct === null ? "No data" : `${m.churnPct}%`}
          hint={`${m.canceledThisMonth} cancelamentos`}
        />
        <Stat
          label="Provider cost (month)"
          value={moneyByCurrency(m.providerCostMonthActual, "USD 0.00")}
          hint={`estimated: ${moneyByCurrency(m.providerCostMonthEstimated, "USD 0.00")}`}
        />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Platform</h2>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Projects" value={String(m.projects)} />
        <Stat label="Deployments (total)" value={String(m.deploymentsTotal)} />
        <Stat label="Deployments today" value={String(m.deploymentsToday)} />
        <Stat label="Failed today" value={String(m.failedDeploymentsToday)} />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Recent activity</h2>
      <div className="overflow-hidden rounded-lg border border-edge">
        {recentDeployments.length === 0 ? (
          <p className="bg-panel p-5 text-sm text-ink-faint">No deployments yet.</p>
        ) : (
          <table className="w-full bg-panel text-sm">
            <tbody>
              {recentDeployments.map((deployment) => (
                <tr key={deployment.id} className="border-b border-edge-soft last:border-0">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/customers/${deployment.project.organizationId}`}
                      className="text-xs text-ink-faint hover:text-ink"
                    >
                      {deployment.project.organization.name}
                    </Link>
                    <p className="text-sm">{deployment.project.name}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={deployment.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-ink-faint">
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
