import { estimateArchitectureCost, resolveUsage } from "@autocloud/cost-engine";
import type {
  ArchitectureCostEstimate,
  ArchitectureType,
  ExpectedUsage,
  ProjectAnalysis,
  ProviderPricingTable,
} from "@autocloud/shared";

export interface DeployInput {
  projectSlug: string;
  deploymentId: string;
  architecture: ArchitectureType;
  /** Caminho local do artefato tar.gz com arquivos já buildados. */
  artifactPath: string;
  /** Env vars do projeto (já decriptadas) a injetar no runtime. */
  env: Record<string, string>;
}

export interface DeployResult {
  /** URL pública do deployment. */
  url: string;
  /** Referência interna do provider (id do worker, path local, etc.). */
  providerRef: string;
  /**
   * URL para health check server-side. Default: a própria url — providers
   * cujo endereço público não resolve de dentro do servidor (ex.: subdomínio
   * .localhost) fornecem um endereço interno equivalente.
   */
  healthUrl?: string;
}

export interface ProviderHealth {
  healthy: boolean;
  message?: string;
}

/**
 * Contrato que todo provider de infraestrutura implementa. A plataforma
 * nunca fala com um provider fora desta interface — trocar Cloudflare por
 * AWS/Hetzner/servidor próprio é implementar isto e registrar no registry.
 */
export interface DeploymentProvider {
  readonly slug: string;
  readonly name: string;
  readonly defaultRegion: string;
  /** Tabela de preços vigente do provider (config, vinda do banco ou snapshot). */
  readonly pricing: ProviderPricingTable;

  deploy(input: DeployInput): Promise<DeployResult>;
  destroy(ref: { projectSlug: string; providerRef: string }): Promise<void>;
  getLogs(ref: { providerRef: string; limit?: number }): Promise<string[]>;
  getMetrics(ref: { providerRef: string }): Promise<Record<string, number>>;
  estimateCost(
    analysis: ProjectAnalysis,
    usage?: Partial<ExpectedUsage>,
  ): Promise<ArchitectureCostEstimate[]>;
  healthCheck(): Promise<ProviderHealth>;
}

/** Implementação default de estimateCost — delega ao CostEngine com a tabela do provider. */
export function estimateWithPricing(
  pricing: ProviderPricingTable,
  analysis: ProjectAnalysis,
  usage?: Partial<ExpectedUsage>,
): ArchitectureCostEstimate[] {
  const resolved = resolveUsage(usage);
  return pricing.supportedArchitectures.map((arch) =>
    estimateArchitectureCost(pricing, arch, analysis, resolved),
  );
}

export class ProviderNotFoundError extends Error {
  constructor(slug: string) {
    super(`Provider não registrado: ${slug}`);
    this.name = "ProviderNotFoundError";
  }
}

export class ProviderRegistry {
  private readonly providers = new Map<string, DeploymentProvider>();

  register(provider: DeploymentProvider): void {
    this.providers.set(provider.slug, provider);
  }

  get(slug: string): DeploymentProvider {
    const provider = this.providers.get(slug);
    if (!provider) throw new ProviderNotFoundError(slug);
    return provider;
  }

  has(slug: string): boolean {
    return this.providers.has(slug);
  }

  list(): DeploymentProvider[] {
    return [...this.providers.values()];
  }

  /** Capabilities para o AICloudRouter (só providers com adapter real). */
  capabilities(): Array<{ provider: string; defaultRegion: string }> {
    return this.list().map((p) => ({ provider: p.slug, defaultRegion: p.defaultRegion }));
  }
}
