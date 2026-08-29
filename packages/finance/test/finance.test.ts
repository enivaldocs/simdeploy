import { describe, expect, it } from "vitest";
import {
  addMoney,
  arrFromMrr,
  balanceOf,
  CurrencyMismatchError,
  computeArpu,
  computeBalances,
  computeChurnRate,
  computeFunnel,
  computeGrossMargin,
  computeLtv,
  computeMrr,
  convertMoney,
  formatMinor,
  sumByCurrency,
} from "../src/index.js";

describe("money", () => {
  it("soma na mesma moeda", () => {
    expect(
      addMoney({ amountMinor: 2900, currency: "BRL" }, { amountMinor: 5900, currency: "BRL" }),
    ).toEqual({ amountMinor: 8800, currency: "BRL" });
  });

  it("recusa somar moedas diferentes", () => {
    expect(() =>
      addMoney({ amountMinor: 100, currency: "BRL" }, { amountMinor: 100, currency: "USD" }),
    ).toThrow(CurrencyMismatchError);
  });

  it("recusa valores não inteiros (float proibido)", () => {
    expect(() =>
      addMoney({ amountMinor: 10.5, currency: "BRL" }, { amountMinor: 1, currency: "BRL" }),
    ).toThrow(/minor units/);
  });

  it("agrupa somas por moeda", () => {
    const result = sumByCurrency([
      { amountMinor: 100, currency: "BRL" },
      { amountMinor: 250, currency: "USD" },
      { amountMinor: 900, currency: "BRL" },
    ]);
    expect(result).toEqual({ BRL: 1000, USD: 250 });
  });

  it("converte com taxa explícita e arredonda para inteiro", () => {
    // USD 5.00 com taxa 5.43 → R$ 27.15
    expect(convertMoney({ amountMinor: 500, currency: "USD" }, "BRL", 5.43)).toEqual({
      amountMinor: 2715,
      currency: "BRL",
    });
  });

  it("formata minor units", () => {
    expect(formatMinor(2900, "BRL")).toBe("R$ 29.00");
  });
});

describe("mrr/arpu", () => {
  const subs = [
    { status: "ACTIVE", priceMonthlyMinor: 2900, currency: "BRL" },
    { status: "ACTIVE", priceMonthlyMinor: 5900, currency: "BRL" },
    { status: "ACTIVE", priceMonthlyMinor: 0, currency: "BRL" }, // free não conta
    { status: "CANCELED", priceMonthlyMinor: 14900, currency: "BRL" }, // cancelada não conta
  ];

  it("MRR conta só assinaturas ativas pagas", () => {
    expect(computeMrr(subs)).toEqual({ BRL: 8800 });
  });

  it("ARR = 12x MRR", () => {
    expect(arrFromMrr({ BRL: 8800 })).toEqual({ BRL: 105600 });
  });

  it("ARPU divide pelo número de pagantes; null sem pagantes", () => {
    expect(computeArpu({ BRL: 8800 }, 2)).toEqual({ BRL: 4400 });
    expect(computeArpu({ BRL: 0 }, 0)).toBeNull();
  });
});

describe("gross margin", () => {
  it("calcula lucro e margem na mesma moeda", () => {
    const result = computeGrossMargin({
      revenue: { amountMinor: 5900, currency: "BRL" },
      cost: { amountMinor: 1000, currency: "BRL" },
    });
    expect(result.profit.amountMinor).toBe(4900);
    expect(result.marginPct).toBe(83.05);
    expect(result.converted).toBe(false);
  });

  it("converte custo USD com fxRate configurado", () => {
    const result = computeGrossMargin({
      revenue: { amountMinor: 5900, currency: "BRL" },
      cost: { amountMinor: 100, currency: "USD" },
      fxRate: 5.0,
    });
    expect(result.profit.amountMinor).toBe(5900 - 500);
    expect(result.converted).toBe(true);
  });

  it("SEM fxRate, moedas diferentes lançam erro (nunca soma cru)", () => {
    expect(() =>
      computeGrossMargin({
        revenue: { amountMinor: 5900, currency: "BRL" },
        cost: { amountMinor: 100, currency: "USD" },
      }),
    ).toThrow(CurrencyMismatchError);
  });

  it("margem null quando revenue é zero", () => {
    const result = computeGrossMargin({
      revenue: { amountMinor: 0, currency: "BRL" },
      cost: { amountMinor: 0, currency: "BRL" },
    });
    expect(result.marginPct).toBeNull();
  });
});

describe("churn/ltv", () => {
  it("churn do período", () => {
    expect(computeChurnRate(2, 40)).toBe(5);
  });
  it("churn null sem base (não inventa 0%)", () => {
    expect(computeChurnRate(0, 0)).toBeNull();
  });
  it("LTV = ARPU/churn; null sem churn observado", () => {
    expect(computeLtv(4400, 5)).toBe(88000);
    expect(computeLtv(4400, null)).toBeNull();
    expect(computeLtv(4400, 0)).toBeNull();
  });
});

describe("funnel", () => {
  it("calcula conversão por etapa e do topo", () => {
    const funnel = computeFunnel([
      { name: "landing_view", count: 1000 },
      { name: "signup_completed", count: 100 },
      { name: "deploy_completed", count: 40 },
    ]);
    expect(funnel[0]?.stepConversionPct).toBeNull();
    expect(funnel[1]?.stepConversionPct).toBe(10);
    expect(funnel[2]?.stepConversionPct).toBe(40);
    expect(funnel[2]?.topConversionPct).toBe(4);
  });

  it("sem base, conversão é null (não 0 fake)", () => {
    const funnel = computeFunnel([
      { name: "a", count: 0 },
      { name: "b", count: 0 },
    ]);
    expect(funnel[1]?.stepConversionPct).toBeNull();
    expect(funnel[1]?.topConversionPct).toBeNull();
  });
});

describe("credit ledger", () => {
  const entries = [
    { amountMinor: 5000, currency: "BRL" }, // crédito promo
    { amountMinor: -1200, currency: "BRL" }, // débito de uso
    { amountMinor: -300, currency: "BRL" },
    { amountMinor: 1000, currency: "USD" },
  ];

  it("saldo é derivado da soma das entradas, por moeda", () => {
    expect(computeBalances(entries)).toEqual({ BRL: 3500, USD: 1000 });
    expect(balanceOf(entries, "BRL")).toBe(3500);
  });

  it("moeda sem entradas tem saldo 0", () => {
    expect(balanceOf(entries, "EUR")).toBe(0);
  });
});
