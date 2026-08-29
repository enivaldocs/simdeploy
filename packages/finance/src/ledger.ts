import { assertMinorUnits } from "./money.js";

/**
 * Ledger de créditos: o saldo é SEMPRE derivado da soma das entradas
 * (positivas = crédito, negativas = débito), por moeda. Nunca armazenado.
 */

export interface LedgerEntryLike {
  amountMinor: number;
  currency: string;
}

export function computeBalances(entries: LedgerEntryLike[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const entry of entries) {
    assertMinorUnits(entry.amountMinor);
    balances[entry.currency] = (balances[entry.currency] ?? 0) + entry.amountMinor;
  }
  return balances;
}

/** Saldo em uma moeda específica (0 quando não há entradas nela). */
export function balanceOf(entries: LedgerEntryLike[], currency: string): number {
  return computeBalances(entries)[currency] ?? 0;
}
