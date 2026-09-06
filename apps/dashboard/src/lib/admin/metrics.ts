import { prisma } from "@simdeploy/db";
import {
  arrFromMrr,
  computeArpu,
  computeChurnRate,
  computeGrossMargin,
  computeLtv,
  computeMrr,
  type GrossMarginResult,
} from "@simdeploy/finance";
import { getFxRateUsdBrl } from "./config";

/**
 * Agregações do admin — TODAS sobre dados reais do banco. Métrica sem base
 * de dados retorna null e a UI exibe "No data". Nada é inventado.
 */

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function revenueByCurrency(since: Date): Promise<Record<string, number>> {
  const rows = await prisma.payment.groupBy({
    by: ["currency"],
    where: { status: "SUCCEEDED", createdAt: { gte: since } },
    _sum: { amountMinor: true },
  });
  return Object.fromEntries(rows.map((r) => [r.currency, r._sum.amountMinor ?? 0]));
}

export async function providerCostByCurrency(
  kind: "ACTUAL" | "ESTIMATED",
  since: Date,
): Promise<Record<string, number>> {
  const rows = await prisma.providerCost.groupBy({
    by: ["currency"],
    where: { kind, periodStart: { gte: since } },
    _sum: { amountMinor: true },
  });
  return Object.fromEntries(rows.map((r) => [r.currency, r._sum.amountMinor ?? 0]));
}

export interface ActiveSubscriptionLike {
  status: string;
  priceMonthlyMinor: number;
  currency: string;
}

export async function activePaidSubscriptions(): Promise<ActiveSubscriptionLike[]> {
  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: true },
  });
  return subs.map((s) => ({
    status: s.status,
    priceMonthlyMinor: s.plan.priceMonthlyMinor,
    currency: s.plan.currency,
  }));
}

/**
 * Margem bruta BRL: revenue BRL vs custo ACTUAL (convertido por fx quando em
 * USD). Retorna null quando há custo em moeda diferente e nenhuma taxa
 * configurada — a UI pede a configuração em vez de mostrar número errado.
 */
export async function grossMarginBrl(since: Date): Promise<GrossMarginResult | null> {
  const revenue = (await revenueByCurrency(since)).BRL ?? 0;
  const costs = await providerCostByCurrency("ACTUAL", since);
  const fxRate = await getFxRateUsdBrl();

  let costBrl = costs.BRL ?? 0;
  for (const [currency, amountMinor] of Object.entries(costs)) {
    if (currency === "BRL") continue;
    if (amountMinor === 0) continue;
    if (currency === "USD" && fxRate) {
      costBrl += Math.round(amountMinor * fxRate);
    } else {
      return null; // custo em moeda sem taxa de conversão configurada
    }
  }
  return computeGrossMargin({
    revenue: { amountMinor: revenue, currency: "BRL" },
    cost: { amountMinor: costBrl, currency: "BRL" },
  });
}

export interface OverviewMetrics {
  revenueTodayByCurrency: Record<string, number>;
  revenueMonthByCurrency: Record<string, number>;
  mrr: Record<string, number>;
  arr: Record<string, number>;
  customers: number;
  paidCustomers: number;
  trials: number;
  churnPct: number | null;
  canceledThisMonth: number;
  projects: number;
  deploymentsTotal: number;
  deploymentsToday: number;
  failedDeploymentsToday: number;
  providerCostMonthActual: Record<string, number>;
  providerCostMonthEstimated: Record<string, number>;
  grossMargin: GrossMarginResult | null;
  fxRateConfigured: boolean;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const today = startOfToday();
  const month = startOfMonth();

  const [
    revenueTodayByCurrency,
    revenueMonthByCurrency,
    subs,
    customers,
    trials,
    canceledThisMonth,
    projects,
    deploymentsTotal,
    deploymentsToday,
    failedDeploymentsToday,
    costActual,
    costEstimated,
    margin,
    fxRate,
  ] = await Promise.all([
    revenueByCurrency(today),
    revenueByCurrency(month),
    activePaidSubscriptions(),
    prisma.organization.count(),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.subscription.count({ where: { canceledAt: { gte: month } } }),
    prisma.project.count(),
    prisma.deployment.count(),
    prisma.deployment.count({ where: { createdAt: { gte: today } } }),
    prisma.deployment.count({
      where: {
        createdAt: { gte: today },
        status: { in: ["ANALYSIS_FAILED", "BUILD_FAILED", "DEPLOY_FAILED"] },
      },
    }),
    providerCostByCurrency("ACTUAL", month),
    providerCostByCurrency("ESTIMATED", month),
    grossMarginBrl(month),
    getFxRateUsdBrl(),
  ]);

  const paidSubs = subs.filter((s) => s.priceMonthlyMinor > 0);
  const mrr = computeMrr(subs);

  return {
    revenueTodayByCurrency,
    revenueMonthByCurrency,
    mrr,
    arr: arrFromMrr(mrr),
    customers,
    paidCustomers: paidSubs.length,
    trials,
    churnPct: computeChurnRate(canceledThisMonth, paidSubs.length + canceledThisMonth),
    canceledThisMonth,
    projects,
    deploymentsTotal,
    deploymentsToday,
    failedDeploymentsToday,
    providerCostMonthActual: costActual,
    providerCostMonthEstimated: costEstimated,
    grossMargin: margin,
    fxRateConfigured: fxRate !== null,
  };
}

export interface UnitEconomics {
  arpu: Record<string, number> | null;
  mrr: Record<string, number>;
  avgCostPerCustomerMinor: number | null;
  avgCostPerProjectMinor: number | null;
  costCurrency: string;
  churnPct: number | null;
  ltvMinor: number | null;
  paidCustomers: number;
}

export async function getUnitEconomics(): Promise<UnitEconomics> {
  const month = startOfMonth();
  const [subs, customers, projects, costs, canceledThisMonth] = await Promise.all([
    activePaidSubscriptions(),
    prisma.organization.count(),
    prisma.project.count(),
    providerCostByCurrency("ACTUAL", month),
    prisma.subscription.count({ where: { canceledAt: { gte: month } } }),
  ]);

  const paid = subs.filter((s) => s.priceMonthlyMinor > 0).length;
  const mrr = computeMrr(subs);
  const arpu = computeArpu(mrr, paid);
  const churnPct = computeChurnRate(canceledThisMonth, paid + canceledThisMonth);

  // Custos ACTUAL do mês (USD do provider). Média por cliente/projeto.
  const costUsd = costs.USD ?? 0;
  const avgCostPerCustomerMinor = customers > 0 ? Math.round(costUsd / customers) : null;
  const avgCostPerProjectMinor = projects > 0 ? Math.round(costUsd / projects) : null;

  return {
    arpu,
    mrr,
    avgCostPerCustomerMinor,
    avgCostPerProjectMinor,
    costCurrency: "USD",
    churnPct,
    ltvMinor: arpu?.BRL !== undefined ? computeLtv(arpu.BRL, churnPct) : null,
    paidCustomers: paid,
  };
}
