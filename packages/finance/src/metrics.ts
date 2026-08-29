import { CurrencyMismatchError, convertMoney, type Money } from "./money.js";

/**
 * Métricas de negócio derivadas de dados reais. Quando não há dados
 * suficientes para uma métrica, o retorno é null — o chamador exibe
 * "No data", nunca um número inventado.
 */

export interface SubscriptionLike {
  status: string;
  priceMonthlyMinor: number;
  currency: string;
}

/** MRR por moeda a partir das assinaturas ativas (inclui trials pagantes = não). */
export function computeMrr(subscriptions: SubscriptionLike[]): Record<string, number> {
  const mrr: Record<string, number> = {};
  for (const sub of subscriptions) {
    if (sub.status !== "ACTIVE") continue;
    if (sub.priceMonthlyMinor <= 0) continue;
    mrr[sub.currency] = (mrr[sub.currency] ?? 0) + sub.priceMonthlyMinor;
  }
  return mrr;
}

export function arrFromMrr(mrr: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(mrr).map(([currency, v]) => [currency, v * 12]));
}

/** ARPU mensal por moeda; null se não há pagantes. */
export function computeArpu(
  mrr: Record<string, number>,
  payingCustomers: number,
): Record<string, number> | null {
  if (payingCustomers <= 0) return null;
  return Object.fromEntries(
    Object.entries(mrr).map(([currency, v]) => [currency, Math.round(v / payingCustomers)]),
  );
}

export interface GrossMarginInput {
  revenue: Money;
  cost: Money;
  /** Taxa (unidades de revenue.currency por 1 unidade de cost.currency). */
  fxRate?: number | null;
}

export interface GrossMarginResult {
  profit: Money;
  marginPct: number | null;
  /** true quando o custo foi convertido por fxRate. */
  converted: boolean;
}

/**
 * Lucro bruto e margem. Moedas diferentes exigem fxRate configurado —
 * sem taxa, lança CurrencyMismatchError (o chamador mostra "configure FX"),
 * jamais soma cru.
 */
export function computeGrossMargin(input: GrossMarginInput): GrossMarginResult {
  let cost = input.cost;
  let converted = false;
  if (cost.currency !== input.revenue.currency) {
    if (!input.fxRate || input.fxRate <= 0) {
      throw new CurrencyMismatchError(input.revenue.currency, cost.currency);
    }
    cost = convertMoney(cost, input.revenue.currency, input.fxRate);
    converted = true;
  }
  const profitMinor = input.revenue.amountMinor - cost.amountMinor;
  return {
    profit: { amountMinor: profitMinor, currency: input.revenue.currency },
    marginPct:
      input.revenue.amountMinor > 0
        ? Math.round((profitMinor / input.revenue.amountMinor) * 10000) / 100
        : null,
    converted,
  };
}

/** Churn do período; null quando não havia base no início. */
export function computeChurnRate(canceledInPeriod: number, activeAtStart: number): number | null {
  if (activeAtStart <= 0) return null;
  return Math.round((canceledInPeriod / activeAtStart) * 10000) / 100;
}

/** LTV simples = ARPU / churn mensal; null sem churn observado (> 0). */
export function computeLtv(arpuMinor: number, churnRatePct: number | null): number | null {
  if (churnRatePct === null || churnRatePct <= 0) return null;
  return Math.round(arpuMinor / (churnRatePct / 100));
}
