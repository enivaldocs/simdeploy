import { compareEstimates } from "@simdeploy/cost-engine";
import type {
  ArchitectureCostEstimate,
  ArchitectureType,
  ProjectAnalysis,
  RoutingDecision,
  RoutingStrategy,
} from "@simdeploy/shared";

export interface ProviderCapability {
  /** Slug do provider com adapter disponível para deploy real. */
  provider: string;
  /** Região default reportada pelo adapter (ex.: "global", "local"). */
  defaultRegion: string;
}

export interface RouteInput {
  analysis: ProjectAnalysis;
  /** Estimativas produzidas pelo CostEngine (todas, compatíveis ou não). */
  estimates: ArchitectureCostEstimate[];
  /** Providers com adapter registrado — o router nunca escolhe fora daqui. */
  availableProviders: ProviderCapability[];
  strategy?: RoutingStrategy;
}

/** Recursos default por arquitetura (config de runtime do deployment). */
const ARCH_RESOURCES: Record<ArchitectureType, { memoryMb: number; timeoutSec: number }> = {
  static: { memoryMb: 128, timeoutSec: 10 },
  edge: { memoryMb: 128, timeoutSec: 10 },
  serverless: { memoryMb: 128, timeoutSec: 30 },
  hybrid: { memoryMb: 128, timeoutSec: 30 },
  "node-server": { memoryMb: 512, timeoutSec: 300 },
};

/** Pontuação de performance por arquitetura (edge/static na frente). */
const PERFORMANCE_RANK: Record<ArchitectureType, number> = {
  edge: 0,
  static: 1,
  hybrid: 2,
  serverless: 3,
  "node-server": 4,
};

export class NoRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoRouteError";
  }
}

/**
 * AICloudRouter: decide provider, arquitetura, região e recursos a partir da
 * análise + estimativas de custo. Critérios em ordem: compatibilidade,
 * disponibilidade de adapter, estratégia (CHEAPEST default).
 */
export function routeDeployment(input: RouteInput): RoutingDecision {
  const strategy = input.strategy ?? "CHEAPEST";
  const available = new Map(input.availableProviders.map((p) => [p.provider, p]));

  const candidates = input.estimates
    .filter((e) => e.compatible)
    .filter((e) => available.has(e.provider));

  if (candidates.length === 0) {
    throw new NoRouteError(
      "Nenhum provider disponível suporta uma arquitetura compatível com este projeto.",
    );
  }

  const sorted = [...candidates].sort((a, b) => {
    if (strategy === "PERFORMANCE") {
      const rankDelta = PERFORMANCE_RANK[a.architecture] - PERFORMANCE_RANK[b.architecture];
      if (rankDelta !== 0) return rankDelta;
    }
    // CHEAPEST e BALANCED: custo primeiro (BALANCED difere no futuro, quando
    // houver métricas de performance reais por provider para ponderar).
    return compareEstimates(a, b);
  });

  const chosen = sorted[0];
  if (!chosen) throw new NoRouteError("Estado impossível: candidatos vazios após ordenação.");
  const capability = available.get(chosen.provider);
  if (!capability) throw new NoRouteError("Provider escolhido sem capability registrada.");

  const reasons = [
    `Arquitetura ${chosen.architecture} compatível com o projeto (${input.analysis.framework}).`,
    strategy === "CHEAPEST"
      ? `Menor custo estimado entre ${candidates.length} opções compatíveis (USD ${chosen.monthlyUsd.toFixed(2)}/mês).`
      : `Estratégia ${strategy} aplicada sobre ${candidates.length} opções compatíveis.`,
  ];
  if (input.analysis.recommendedArchitecture === chosen.architecture) {
    reasons.push("Coincide com a arquitetura recomendada pela análise do projeto.");
  }

  return {
    provider: chosen.provider,
    architecture: chosen.architecture,
    region: capability.defaultRegion,
    strategy,
    resources: ARCH_RESOURCES[chosen.architecture],
    estimate: chosen,
    reasons,
  };
}
