import type { ArchitectureCostEstimate, ProjectAnalysis } from "@simdeploy/shared";
import { describe, expect, it } from "vitest";
import { NoRouteError, routeDeployment } from "../src/router.js";

function makeAnalysis(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
  return {
    schemaVersion: 1,
    framework: "nextjs",
    frameworkVersion: "15.0.0",
    runtime: "node",
    packageManager: "pnpm",
    buildCommand: "next build",
    outputDir: ".next",
    fileCount: 100,
    totalSizeBytes: 1_000_000,
    staticPercentage: 80,
    requiresServer: true,
    requiresDatabase: false,
    databaseType: null,
    backgroundJobs: false,
    cronJobs: 0,
    apiRouteCount: 3,
    hasDockerfile: false,
    envVarsDetected: [],
    dependencies: [],
    recommendedArchitecture: "hybrid",
    warnings: [],
    ...overrides,
  };
}

function estimate(
  provider: string,
  architecture: ArchitectureCostEstimate["architecture"],
  monthlyUsd: number,
  compatible = true,
): ArchitectureCostEstimate {
  return {
    provider,
    architecture,
    compatible,
    incompatibilityReasons: compatible ? [] : ["incompatível"],
    monthlyUsd,
    breakdown: [],
    assumptions: {
      monthlyRequests: 50_000,
      monthlyBandwidthGb: 5,
      storageGb: 1,
      buildMinutesPerMonth: 20,
      avgFunctionDurationMs: 50,
      functionMemoryMb: 128,
    },
  };
}

const PROVIDERS = [
  { provider: "cloudflare", defaultRegion: "global" },
  { provider: "local", defaultRegion: "local" },
];

describe("routeDeployment (AICloudRouter)", () => {
  it("CHEAPEST escolhe a opção compatível mais barata", () => {
    const decision = routeDeployment({
      analysis: makeAnalysis(),
      estimates: [
        estimate("cloudflare", "hybrid", 5),
        estimate("cloudflare", "serverless", 12),
        estimate("local", "static", 0, false),
      ],
      availableProviders: PROVIDERS,
      strategy: "CHEAPEST",
    });
    expect(decision.provider).toBe("cloudflare");
    expect(decision.architecture).toBe("hybrid");
    expect(decision.region).toBe("global");
    expect(decision.reasons.length).toBeGreaterThan(0);
  });

  it("ignora estimates de providers sem adapter disponível", () => {
    const decision = routeDeployment({
      analysis: makeAnalysis(),
      estimates: [estimate("hetzner", "node-server", 1), estimate("cloudflare", "hybrid", 5)],
      availableProviders: PROVIDERS,
    });
    expect(decision.provider).toBe("cloudflare");
  });

  it("ignora estimates incompatíveis mesmo sendo mais baratas", () => {
    const decision = routeDeployment({
      analysis: makeAnalysis(),
      estimates: [estimate("cloudflare", "static", 0, false), estimate("cloudflare", "hybrid", 5)],
      availableProviders: PROVIDERS,
    });
    expect(decision.architecture).toBe("hybrid");
  });

  it("PERFORMANCE prefere arquiteturas edge/static", () => {
    const decision = routeDeployment({
      analysis: makeAnalysis({ requiresServer: false, apiRouteCount: 0 }),
      estimates: [estimate("cloudflare", "serverless", 0), estimate("cloudflare", "static", 0)],
      availableProviders: PROVIDERS,
      strategy: "PERFORMANCE",
    });
    expect(decision.architecture).toBe("static");
  });

  it("default é CHEAPEST", () => {
    const decision = routeDeployment({
      analysis: makeAnalysis(),
      estimates: [estimate("cloudflare", "hybrid", 5)],
      availableProviders: PROVIDERS,
    });
    expect(decision.strategy).toBe("CHEAPEST");
  });

  it("lança NoRouteError sem candidatos", () => {
    expect(() =>
      routeDeployment({
        analysis: makeAnalysis(),
        estimates: [estimate("hetzner", "node-server", 1)],
        availableProviders: PROVIDERS,
      }),
    ).toThrow(NoRouteError);
  });
});
