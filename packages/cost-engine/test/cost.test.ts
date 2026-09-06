import type { ProjectAnalysis, ProviderPricingTable } from "@simdeploy/shared";
import { describe, expect, it } from "vitest";
import {
  architectureCompatibility,
  CLOUDFLARE_PRICING,
  DEFAULT_PRICING_TABLES,
  DEFAULT_USAGE,
  estimateArchitectureCost,
  estimateCosts,
  resolveUsage,
} from "../src/index.js";

function makeAnalysis(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
  return {
    schemaVersion: 1,
    framework: "vite",
    frameworkVersion: "6.0.0",
    runtime: "static",
    packageManager: "pnpm",
    buildCommand: "npm run build",
    outputDir: "dist",
    fileCount: 100,
    totalSizeBytes: 1_000_000,
    staticPercentage: 100,
    requiresServer: false,
    requiresDatabase: false,
    databaseType: null,
    backgroundJobs: false,
    cronJobs: 0,
    apiRouteCount: 0,
    hasDockerfile: false,
    envVarsDetected: [],
    dependencies: [],
    recommendedArchitecture: "static",
    warnings: [],
    ...overrides,
  };
}

describe("architectureCompatibility", () => {
  it("static incompatível com projeto que exige servidor", () => {
    const result = architectureCompatibility("static", makeAnalysis({ requiresServer: true }));
    expect(result.compatible).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("serverless incompatível com background jobs", () => {
    expect(
      architectureCompatibility("serverless", makeAnalysis({ backgroundJobs: true })).compatible,
    ).toBe(false);
  });

  it("node-server compatível com qualquer análise", () => {
    expect(
      architectureCompatibility(
        "node-server",
        makeAnalysis({ backgroundJobs: true, hasDockerfile: true, requiresServer: true }),
      ).compatible,
    ).toBe(true);
  });
});

describe("estimateArchitectureCost", () => {
  it("site estático no Cloudflare custa zero no perfil default", () => {
    const estimate = estimateArchitectureCost(
      CLOUDFLARE_PRICING,
      "static",
      makeAnalysis(),
      DEFAULT_USAGE,
    );
    expect(estimate.compatible).toBe(true);
    expect(estimate.monthlyUsd).toBe(0);
  });

  it("free allowance é aplicada antes de cobrar", () => {
    const table: ProviderPricingTable = {
      provider: "test",
      currency: "USD",
      updatedAt: "2026-01-01",
      source: "test",
      supportedArchitectures: ["serverless"],
      resources: [
        {
          resource: "requests",
          unit: "request",
          pricePerUnit: 0.000001,
          freeAllowance: 1_000_000,
          architectures: ["serverless"],
        },
      ],
    };
    const analysis = makeAnalysis({
      requiresServer: true,
      staticPercentage: 0,
      recommendedArchitecture: "serverless",
    });
    // 3M requests com 1M grátis → 2M cobráveis × 0.000001 = USD 2.00
    const estimate = estimateArchitectureCost(
      table,
      "serverless",
      analysis,
      resolveUsage({ monthlyRequests: 3_000_000 }),
    );
    const requestsLine = estimate.breakdown.find((l) => l.resource === "requests");
    expect(requestsLine?.billableQuantity).toBe(2_000_000);
    expect(estimate.monthlyUsd).toBe(2);
  });

  it("hybrid cobra funções só pela fatia dinâmica do tráfego", () => {
    const analysis = makeAnalysis({
      framework: "nextjs",
      requiresServer: true,
      staticPercentage: 80,
      apiRouteCount: 3,
      recommendedArchitecture: "hybrid",
    });
    const estimate = estimateArchitectureCost(
      CLOUDFLARE_PRICING,
      "hybrid",
      analysis,
      resolveUsage({ monthlyRequests: 1_000_000 }),
    );
    const requestsLine = estimate.breakdown.find((l) => l.resource === "requests");
    // 20% dinâmico de 1M = 200k requests a funções, dentro do free allowance
    expect(requestsLine?.quantity).toBe(200_000);
    expect(requestsLine?.costUsd).toBe(0);
  });
});

describe("estimateCosts", () => {
  it("recomenda static para site Vite e retorna alternativas ordenadas", () => {
    const result = estimateCosts(makeAnalysis(), { tables: DEFAULT_PRICING_TABLES });
    expect(result.recommended.architecture).toBe("static");
    expect(result.recommended.monthlyUsd).toBe(0);
    expect(result.disclaimer.length).toBeGreaterThan(0);
    for (let i = 1; i < result.alternatives.length; i++) {
      const prev = result.alternatives[i - 1];
      const curr = result.alternatives[i];
      if (prev && curr) expect(prev.monthlyUsd).toBeLessThanOrEqual(curr.monthlyUsd);
    }
  });

  it("recomenda hybrid para Next.js com API e majoritariamente estático", () => {
    const analysis = makeAnalysis({
      framework: "nextjs",
      runtime: "node",
      requiresServer: true,
      staticPercentage: 85,
      apiRouteCount: 3,
      recommendedArchitecture: "hybrid",
    });
    const result = estimateCosts(analysis, { tables: DEFAULT_PRICING_TABLES });
    expect(result.recommended.architecture).toBe("hybrid");
    expect(result.recommended.provider).toBe("cloudflare");
    expect(result.recommended.monthlyUsd).toBeGreaterThan(0);
  });

  it("app com background jobs cai para node-server", () => {
    const analysis = makeAnalysis({
      framework: "express",
      runtime: "node",
      requiresServer: true,
      staticPercentage: 10,
      backgroundJobs: true,
      recommendedArchitecture: "node-server",
    });
    const result = estimateCosts(analysis, { tables: DEFAULT_PRICING_TABLES });
    expect(result.recommended.architecture).toBe("node-server");
    expect(result.recommended.provider).toBe("hetzner");
  });

  it("lança erro quando não há arquitetura compatível", () => {
    const onlyStatic: ProviderPricingTable = {
      provider: "static-only",
      currency: "USD",
      updatedAt: "2026-01-01",
      source: "test",
      supportedArchitectures: ["static"],
      resources: [],
    };
    const serverApp = makeAnalysis({ requiresServer: true, recommendedArchitecture: "serverless" });
    expect(() => estimateCosts(serverApp, { tables: [onlyStatic] })).toThrow();
  });
});
