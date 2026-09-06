import { prisma } from "@simdeploy/db";
import { computeGrossMargin, formatMinor } from "@simdeploy/finance";
import Link from "next/link";
import { AdminTable, moneyByCurrency, Stat } from "@/components/admin-ui";
import { getFxRateUsdBrl } from "@/lib/admin/config";
import { getOverviewMetrics } from "@/lib/admin/metrics";
import { requireStaff } from "@/lib/auth/staff";
import { timeAgo } from "@/lib/format";

/** P&L por cliente: revenue BRL - custo ACTUAL do provider (fx quando USD). */
async function customerPnl(fxRate: number | null) {
  const [revenueRows, costRows, orgs] = await Promise.all([
    prisma.payment.groupBy({
      by: ["organizationId", "currency"],
      where: { status: "SUCCEEDED" },
      _sum: { amountMinor: true },
    }),
    prisma.providerCost.groupBy({
      by: ["organizationId", "currency"],
      where: { kind: "ACTUAL" },
      _sum: { amountMinor: true },
    }),
    prisma.organization.findMany({ select: { id: true, name: true } }),
  ]);

  const revenueBrl = new Map<string, number>();
  for (const row of revenueRows) {
    if (row.currency !== "BRL") continue;
    revenueBrl.set(row.organizationId, row._sum.amountMinor ?? 0);
  }
  const costByOrg = new Map<string, { brl: number; usd: number }>();
  for (const row of costRows) {
    if (!row.organizationId) continue;
    const entry = costByOrg.get(row.organizationId) ?? { brl: 0, usd: 0 };
    if (row.currency === "BRL") entry.brl += row._sum.amountMinor ?? 0;
    if (row.currency === "USD") entry.usd += row._sum.amountMinor ?? 0;
    costByOrg.set(row.organizationId, entry);
  }

  return orgs
    .map((org) => {
      const revenue = revenueBrl.get(org.id) ?? 0;
      const cost = costByOrg.get(org.id) ?? { brl: 0, usd: 0 };
      const needsFx = cost.usd > 0 && !fxRate;
      const costBrl = needsFx ? null : cost.brl + (fxRate ? Math.round(cost.usd * fxRate) : 0);
      const margin =
        costBrl === null
          ? null
          : computeGrossMargin({
              revenue: { amountMinor: revenue, currency: "BRL" },
              cost: { amountMinor: costBrl, currency: "BRL" },
            });
      return { org, revenue, costBrl, costUsd: cost.usd, margin };
    })
    .filter((row) => row.revenue > 0 || (row.costBrl ?? 0) > 0 || row.costUsd > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export default async function AdminFinancePage() {
  await requireStaff("finance");
  const [m, fxRate, payments, invoices] = await Promise.all([
    getOverviewMetrics(),
    getFxRateUsdBrl(),
    prisma.payment.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.invoice.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const pnl = await customerPnl(fxRate);
  const failedPayments = payments.filter((p) => p.status === "FAILED").length;
  const refunds = payments.filter((p) => p.status === "REFUNDED").length;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-2 text-xl font-medium">Finance</h1>
      <p className="mb-8 text-xs text-ink-faint">
        Custos ESTIMATED (projeções) e ACTUAL (registrados) nunca se misturam.
        {fxRate
          ? ` Conversão USD→BRL pela taxa configurada: ${fxRate}.`
          : " Sem taxa FX configurada — margens com custo USD mostram 'Configure FX rate' (Settings)."}
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Revenue (month)" value={moneyByCurrency(m.revenueMonthByCurrency)} />
        <Stat label="MRR" value={moneyByCurrency(m.mrr)} />
        <Stat label="ARR" value={moneyByCurrency(m.arr)} />
        <Stat
          label="Provider cost ACTUAL (month)"
          value={moneyByCurrency(m.providerCostMonthActual, "USD 0.00")}
        />
        <Stat
          label="Gross margin (month)"
          value={
            m.grossMargin
              ? `${formatMinor(m.grossMargin.profit.amountMinor, "BRL")}${m.grossMargin.marginPct !== null ? ` (${m.grossMargin.marginPct}%)` : ""}`
              : m.fxRateConfigured
                ? "R$ 0.00"
                : "Configure FX rate"
          }
        />
      </div>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Failed payments (recent)" value={String(failedPayments)} />
        <Stat label="Refunds (recent)" value={String(refunds)} />
        <Stat label="Paid customers" value={String(m.paidCustomers)} />
        <Stat label="Churn (month)" value={m.churnPct === null ? "No data" : `${m.churnPct}%`} />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">P&L per customer (all time)</h2>
      <div className="mb-10">
        <AdminTable
          headers={["Customer", "Revenue", "Provider cost", "Gross profit", "Margin"]}
          empty={pnl.length === 0}
        >
          {pnl.map((row) => (
            <tr key={row.org.id} className="border-b border-edge-soft last:border-0">
              <td className="px-4 py-2.5">
                <Link href={`/admin/customers/${row.org.id}`} className="hover:text-accent">
                  {row.org.name}
                </Link>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">{formatMinor(row.revenue, "BRL")}</td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {row.costBrl === null
                  ? `${formatMinor(row.costUsd, "USD")} (sem FX)`
                  : formatMinor(row.costBrl, "BRL")}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {row.margin
                  ? formatMinor(row.margin.profit.amountMinor, "BRL")
                  : "Configure FX rate"}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {row.margin?.marginPct !== null && row.margin !== null
                  ? `${row.margin.marginPct}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Recent payments</h2>
          <AdminTable
            headers={["Customer", "Amount", "Status", "When"]}
            empty={payments.length === 0}
          >
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-edge-soft last:border-0">
                <td className="px-4 py-2.5 text-xs">{payment.organization.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {formatMinor(payment.amountMinor, payment.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs">{payment.status}</td>
                <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(payment.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Recent invoices</h2>
          <AdminTable
            headers={["Customer", "Amount", "Status", "When"]}
            empty={invoices.length === 0}
          >
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-edge-soft last:border-0">
                <td className="px-4 py-2.5 text-xs">{invoice.organization.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {formatMinor(invoice.amountPaidMinor || invoice.amountDueMinor, invoice.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs">{invoice.status}</td>
                <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(invoice.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>
    </div>
  );
}
