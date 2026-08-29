import { prisma } from "@autocloud/db";
import { balanceOf, computeGrossMargin, formatMinor } from "@autocloud/finance";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTable, Stat } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { getFxRateUsdBrl } from "@/lib/admin/config";
import { requireStaff } from "@/lib/auth/staff";
import { timeAgo } from "@/lib/format";
import { ManualCreditForm } from "./manual-credit-form";

export default async function Customer360Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff("customers");
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      members: { include: { user: true } },
      projects: {
        include: { deployments: { take: 1, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
      payments: { orderBy: { createdAt: "desc" }, take: 15 },
      invoices: { orderBy: { createdAt: "desc" }, take: 15 },
      creditEntries: { orderBy: { createdAt: "desc" }, take: 15 },
      notifications: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!org) notFound();

  const [deployments, usage, providerCosts, auditLogs, analyticsEvents, allCredits] =
    await Promise.all([
      prisma.deployment.findMany({
        where: { project: { organizationId: org.id } },
        include: { project: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.usageMetric.groupBy({
        by: ["metric"],
        where: { project: { organizationId: org.id } },
        _sum: { value: true },
      }),
      prisma.providerCost.groupBy({
        by: ["kind", "currency"],
        where: { organizationId: org.id },
        _sum: { amountMinor: true },
      }),
      prisma.auditLog.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.analyticsEvent.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.creditLedgerEntry.findMany({
        where: { organizationId: org.id },
        select: { amountMinor: true, currency: true },
      }),
    ]);

  const revenueBrl = org.payments
    .filter((p) => p.status === "SUCCEEDED" && p.currency === "BRL")
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const actualCostUsd =
    providerCosts.find((c) => c.kind === "ACTUAL" && c.currency === "USD")?._sum.amountMinor ?? 0;
  const actualCostBrl =
    providerCosts.find((c) => c.kind === "ACTUAL" && c.currency === "BRL")?._sum.amountMinor ?? 0;
  const fxRate = await getFxRateUsdBrl();

  let marginLabel = "No data";
  if (actualCostUsd > 0 && !fxRate) {
    marginLabel = "Configure FX rate";
  } else {
    const costBrl = actualCostBrl + (fxRate ? Math.round(actualCostUsd * fxRate) : 0);
    const margin = computeGrossMargin({
      revenue: { amountMinor: revenueBrl, currency: "BRL" },
      cost: { amountMinor: costBrl, currency: "BRL" },
    });
    marginLabel = `${formatMinor(margin.profit.amountMinor, "BRL")}${
      margin.marginPct !== null ? ` (${margin.marginPct}%)` : ""
    }`;
  }

  const usageMap = Object.fromEntries(usage.map((u) => [u.metric, Number(u._sum.value ?? 0)]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-2 text-xs text-ink-faint">
        <Link href="/admin/customers" className="hover:text-ink">
          Customers
        </Link>{" "}
        / {org.name}
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium">{org.name}</h1>
          <p className="font-mono text-xs text-ink-faint">
            {org.slug} · desde {org.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="text-right text-xs text-ink-dim">
          {org.members.map((m) => (
            <p key={m.id}>
              {m.user.email} <span className="text-ink-faint">({m.role})</span>
            </p>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat
          label="Plan"
          value={org.subscription?.plan.name ?? "—"}
          hint={org.subscription?.status ?? ""}
        />
        <Stat label="Revenue (all time)" value={formatMinor(revenueBrl, "BRL")} />
        <Stat
          label="Provider cost (ACTUAL)"
          value={formatMinor(actualCostUsd, "USD")}
          hint="custo real registrado"
        />
        <Stat label="Gross profit" value={marginLabel} />
        <Stat label="Credit balance" value={formatMinor(balanceOf(allCredits, "BRL"), "BRL")} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Projects" value={String(org.projects.length)} />
        <Stat
          label="Deployments"
          value={String(deployments.length >= 10 ? "10+" : deployments.length)}
        />
        <Stat label="Requests (measured)" value={String(usageMap.requests ?? 0)} />
        <Stat
          label="Bandwidth (measured)"
          value={`${((usageMap.bandwidth_bytes ?? 0) / (1024 * 1024)).toFixed(1)} MB`}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Projects</h2>
          <AdminTable
            headers={["Project", "Framework", "Last deploy"]}
            empty={org.projects.length === 0}
          >
            {org.projects.map((project) => (
              <tr key={project.id} className="border-b border-edge-soft last:border-0">
                <td className="px-4 py-2.5">
                  {project.name}
                  <p className="font-mono text-xs text-ink-faint">{project.slug}</p>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{project.framework ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {project.deployments[0] ? (
                    <StatusBadge status={project.deployments[0].status} />
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Payments</h2>
          <AdminTable headers={["Amount", "Status", "When"]} empty={org.payments.length === 0}>
            {org.payments.map((payment) => (
              <tr key={payment.id} className="border-b border-edge-soft last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs">
                  {formatMinor(payment.amountMinor, payment.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs">{payment.status}</td>
                <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(payment.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Credit ledger</h2>
          <AdminTable
            headers={["Amount", "Type", "Reason", "When"]}
            empty={org.creditEntries.length === 0}
          >
            {org.creditEntries.map((entry) => (
              <tr key={entry.id} className="border-b border-edge-soft last:border-0">
                <td
                  className={`px-4 py-2.5 font-mono text-xs ${entry.amountMinor < 0 ? "text-err" : "text-ok"}`}
                >
                  {formatMinor(entry.amountMinor, entry.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs">{entry.type}</td>
                <td className="px-4 py-2.5 text-xs text-ink-dim">{entry.reason}</td>
                <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(entry.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
          {["ADMIN", "SUPER_ADMIN", "FINANCE"].includes(session.user.staffRole) ? (
            <div className="mt-3">
              <ManualCreditForm organizationId={org.id} />
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Activity timeline</h2>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-edge bg-panel p-4">
            {auditLogs.length === 0 && analyticsEvents.length === 0 ? (
              <p className="text-sm text-ink-faint">No activity recorded.</p>
            ) : (
              <ol className="space-y-1.5">
                {[
                  ...auditLogs.map((log) => ({
                    at: log.createdAt,
                    label: `${log.action} (${log.resourceType})`,
                  })),
                  ...analyticsEvents.map((event) => ({ at: event.createdAt, label: event.name })),
                ]
                  .sort((a, b) => b.at.getTime() - a.at.getTime())
                  .slice(0, 25)
                  .map((item) => (
                    <li key={`${item.at.getTime()}-${item.label}`} className="flex gap-3 text-xs">
                      <span className="shrink-0 font-mono text-ink-faint">
                        {item.at.toISOString().slice(5, 16).replace("T", " ")}
                      </span>
                      <span className="text-ink-dim">{item.label}</span>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
