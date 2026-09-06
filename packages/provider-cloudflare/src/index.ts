import { CLOUDFLARE_PRICING } from "@simdeploy/cost-engine";
import {
  type DeployInput,
  type DeploymentProvider,
  type DeployResult,
  estimateWithPricing,
  type ProviderHealth,
} from "@simdeploy/provider-core";
import type {
  ArchitectureCostEstimate,
  ExpectedUsage,
  ProjectAnalysis,
  ProviderPricingTable,
} from "@simdeploy/shared";

const CF_API = "https://api.cloudflare.com/client/v4";

export interface CloudflareProviderOptions {
  apiToken: string;
  accountId: string;
  /** Permite injetar pricing atualizado do banco; default: snapshot. */
  pricing?: ProviderPricingTable;
}

export class CloudflareNotImplementedError extends Error {
  constructor() {
    super(
      "Deploy no Cloudflare ainda não está habilitado neste MVP — o provider local é o adapter de deploy ativo. healthCheck e estimateCost já são funcionais.",
    );
    this.name = "CloudflareNotImplementedError";
  }
}

/**
 * Adapter Cloudflare (Workers + Static Assets + R2).
 *
 * Estado atual (Fase 3 parcial): healthCheck valida o API token de verdade e
 * estimateCost usa a tabela de preços configurável. O upload de deployment
 * (Workers for Platforms / Static Assets) é a próxima entrega — a interface já
 * é a definitiva, então habilitá-lo não muda nenhum chamador.
 */
export class CloudflareProvider implements DeploymentProvider {
  readonly slug = "cloudflare";
  readonly name = "Cloudflare";
  readonly defaultRegion = "global";
  readonly pricing: ProviderPricingTable;

  constructor(private readonly options: CloudflareProviderOptions) {
    this.pricing = options.pricing ?? CLOUDFLARE_PRICING;
  }

  async deploy(_input: DeployInput): Promise<DeployResult> {
    throw new CloudflareNotImplementedError();
  }

  async destroy(): Promise<void> {
    throw new CloudflareNotImplementedError();
  }

  async getLogs(): Promise<string[]> {
    return [];
  }

  async getMetrics(): Promise<Record<string, number>> {
    return {};
  }

  async estimateCost(
    analysis: ProjectAnalysis,
    usage?: Partial<ExpectedUsage>,
  ): Promise<ArchitectureCostEstimate[]> {
    return estimateWithPricing(this.pricing, analysis, usage);
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.options.apiToken || !this.options.accountId) {
      return { healthy: false, message: "CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID ausentes." };
    }
    try {
      const response = await fetch(`${CF_API}/user/tokens/verify`, {
        headers: { Authorization: `Bearer ${this.options.apiToken}` },
      });
      const body = (await response.json()) as { success?: boolean };
      if (response.ok && body.success) return { healthy: true };
      return { healthy: false, message: `Token Cloudflare inválido (HTTP ${response.status}).` };
    } catch (error) {
      return {
        healthy: false,
        message: `Falha ao verificar token: ${error instanceof Error ? error.message : error}`,
      };
    }
  }
}
