import type {
  ArchitectureCostEstimate,
  ArchitectureType,
  CostBreakdownLine,
  CostRecommendation,
  ExpectedUsage,
  PricingResource,
  ProjectAnalysis,
  ProviderPricingTable,
} from "@autocloud/shared";

export {
  CLOUDFLARE_PRICING,
  DEFAULT_PRICING_TABLES,
  HETZNER_REFERENCE_PRICING,
  LOCAL_PRICING,
} from "./pricing/defaults.js";

/** Perfil de uso default para projetos novos (sem histórico de métricas). */
export const DEFAULT_USAGE: ExpectedUsage = {
  monthlyRequests: 50_000,
  monthlyBandwidthGb: 5,
  storageGb: 1,
  buildMinutesPerMonth: 20,
  avgFunctionDurationMs: 50,
  functionMemoryMb: 128,
};

export function resolveUsage(partial?: Partial<ExpectedUsage>): ExpectedUsage {
  return { ...DEFAULT_USAGE, ...partial };
}

/**
 * Compatibilidade arquitetura × análise. Regras determinísticas:
 * - static/edge: só sem servidor e sem API routes
 * - serverless/hybrid: sem processos persistentes (jobs) e sem Dockerfile
 * - node-server: roda qualquer coisa
 */
export function architectureCompatibility(
  arch: ArchitectureType,
  analysis: ProjectAnalysis,
): { compatible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  switch (arch) {
    case "static":
    case "edge":
      if (analysis.requiresServer) reasons.push("Projeto precisa de servidor (SSR/API).");
      if (analysis.apiRouteCount > 0) reasons.push("Projeto tem API routes.");
      break;
    case "serverless":
    case "hybrid":
      if (analysis.backgroundJobs) {
        reasons.push("Background workers precisam de processo persistente.");
      }
      if (analysis.hasDockerfile) reasons.push("Deploy por container ainda não suportado.");
      break;
    case "node-server":
      break;
  }
  return { compatible: reasons.length === 0, reasons };
}

/**
 * Quantidade consumida de um recurso, dado uso esperado + arquitetura.
 * Em static/edge as requests vão para assets (sem custo de função); em hybrid
 * apenas a fatia dinâmica do tráfego invoca funções.
 */
export function computeQuantity(
  resource: PricingResource,
  arch: ArchitectureType,
  usage: ExpectedUsage,
  analysis: ProjectAnalysis,
): number {
  const dynamicShare = Math.min(1, Math.max(0, (100 - analysis.staticPercentage) / 100));
  switch (resource.resource) {
    case "requests":
      if (arch === "static" || arch === "edge") return 0;
      if (arch === "hybrid") return usage.monthlyRequests * dynamicShare;
      return usage.monthlyRequests;
    case "function_invocation":
      if (arch === "hybrid") return usage.monthlyRequests * dynamicShare;
      if (arch === "serverless") return usage.monthlyRequests;
      return 0;
    case "function_gb_second": {
      const invocations =
        arch === "hybrid"
          ? usage.monthlyRequests * dynamicShare
          : arch === "serverless"
            ? usage.monthlyRequests
            : 0;
      return invocations * (usage.avgFunctionDurationMs / 1000) * (usage.functionMemoryMb / 1024);
    }
    case "bandwidth_gb":
      return usage.monthlyBandwidthGb;
    case "storage_gb":
      return usage.storageGb;
    case "build_minute":
      return usage.buildMinutesPerMonth;
    case "static_hosting_flat":
    case "platform_flat":
      return 1;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Estima o custo mensal de UMA arquitetura em UM provider. */
export function estimateArchitectureCost(
  table: ProviderPricingTable,
  arch: ArchitectureType,
  analysis: ProjectAnalysis,
  usage: ExpectedUsage,
): ArchitectureCostEstimate {
  const { compatible, reasons } = architectureCompatibility(arch, analysis);
  const breakdown: CostBreakdownLine[] = [];

  for (const resource of table.resources) {
    if (!resource.architectures.includes(arch)) continue;
    const quantity = computeQuantity(resource, arch, usage, analysis);
    const billableQuantity = Math.max(0, quantity - resource.freeAllowance);
    const costUsd = billableQuantity * resource.pricePerUnit;
    breakdown.push({
      resource: resource.resource,
      unit: resource.unit,
      quantity: round2(quantity),
      freeAllowance: resource.freeAllowance,
      billableQuantity: round2(billableQuantity),
      pricePerUnit: resource.pricePerUnit,
      costUsd: round2(costUsd),
    });
  }

  return {
    provider: table.provider,
    architecture: arch,
    compatible,
    incompatibilityReasons: reasons,
    monthlyUsd: round2(breakdown.reduce((sum, line) => sum + line.costUsd, 0)),
    breakdown,
    assumptions: usage,
  };
}

/** Ordem de preferência em empate de custo: mais simples de operar primeiro. */
const ARCH_TIEBREAK: ArchitectureType[] = ["static", "edge", "hybrid", "serverless", "node-server"];

export function compareEstimates(a: ArchitectureCostEstimate, b: ArchitectureCostEstimate): number {
  if (a.monthlyUsd !== b.monthlyUsd) return a.monthlyUsd - b.monthlyUsd;
  const archDelta = ARCH_TIEBREAK.indexOf(a.architecture) - ARCH_TIEBREAK.indexOf(b.architecture);
  if (archDelta !== 0) return archDelta;
  return a.provider.localeCompare(b.provider);
}

export interface EstimateCostsOptions {
  usage?: Partial<ExpectedUsage>;
  /** Tabelas de pricing (do banco em produção; snapshot default offline). */
  tables: ProviderPricingTable[];
}

export const ESTIMATE_DISCLAIMER =
  "Projeção baseada em premissas de uso e em snapshot de tabelas públicas de preço — não é fatura real.";

/**
 * CostEngine: ProjectAnalysis + ExpectedUsage + ProviderPricing →
 * arquitetura recomendada, custo estimado e alternativas.
 */
export function estimateCosts(
  analysis: ProjectAnalysis,
  options: EstimateCostsOptions,
): CostRecommendation {
  const usage = resolveUsage(options.usage);
  const all: ArchitectureCostEstimate[] = [];

  for (const table of options.tables) {
    for (const arch of table.supportedArchitectures) {
      all.push(estimateArchitectureCost(table, arch, analysis, usage));
    }
  }

  const compatibles = all.filter((e) => e.compatible).sort(compareEstimates);
  if (compatibles.length === 0) {
    throw new Error("Nenhuma arquitetura compatível encontrada nas tabelas de pricing fornecidas.");
  }

  // Preferência: menor custo entre as compatíveis que batem com a arquitetura
  // recomendada pela análise; se nenhum provider a suporta, menor custo geral.
  const preferred = compatibles.filter((e) => e.architecture === analysis.recommendedArchitecture);
  const recommended = preferred[0] ?? compatibles[0];
  if (!recommended) {
    throw new Error("Estado impossível: lista de estimativas compatíveis vazia.");
  }

  return {
    recommended,
    alternatives: compatibles.filter((e) => e !== recommended),
    currency: "USD",
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}
