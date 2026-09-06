/**
 * Dinheiro na SimDeploy: SEMPRE minor units (centavos) inteiros + currency.
 * Nunca float; nunca somar moedas diferentes sem conversão explícita.
 */

export interface Money {
  amountMinor: number;
  currency: string;
}

export class CurrencyMismatchError extends Error {
  constructor(a: string, b: string) {
    super(`Não é permitido somar moedas diferentes sem conversão: ${a} + ${b}`);
    this.name = "CurrencyMismatchError";
  }
}

export function assertMinorUnits(amountMinor: number): void {
  if (!Number.isInteger(amountMinor)) {
    throw new Error(`Valor monetário deve ser inteiro em minor units, recebido: ${amountMinor}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  assertMinorUnits(a.amountMinor);
  assertMinorUnits(b.amountMinor);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

/** Soma uma lista agrupando por moeda — nunca mistura moedas. */
export function sumByCurrency(items: Money[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    assertMinorUnits(item.amountMinor);
    result[item.currency] = (result[item.currency] ?? 0) + item.amountMinor;
  }
  return result;
}

/**
 * Converte entre moedas com taxa explícita (unidades de `to` por 1 unidade de
 * `from`). Arredonda para o inteiro mais próximo em minor units.
 */
export function convertMoney(money: Money, to: string, rate: number): Money {
  assertMinorUnits(money.amountMinor);
  if (money.currency === to) return { ...money };
  if (!(rate > 0)) throw new Error(`Taxa de conversão inválida: ${rate}`);
  return { amountMinor: Math.round(money.amountMinor * rate), currency: to };
}

const CURRENCY_SYMBOLS: Record<string, string> = { BRL: "R$", USD: "USD", EUR: "EUR" };

export function formatMoney(money: Money): string {
  const symbol = CURRENCY_SYMBOLS[money.currency] ?? money.currency;
  const value = (money.amountMinor / 100).toFixed(2);
  return `${symbol} ${value}`;
}

export function formatMinor(amountMinor: number, currency: string): string {
  return formatMoney({ amountMinor, currency });
}
