import { accessSync, constants, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { LOCAL_PRICING } from "@autocloud/cost-engine";
import {
  type DeployInput,
  type DeploymentProvider,
  type DeployResult,
  estimateWithPricing,
  type ProviderHealth,
} from "@autocloud/provider-core";
import type {
  ArchitectureCostEstimate,
  ExpectedUsage,
  ProjectAnalysis,
  ProviderPricingTable,
} from "@autocloud/shared";
import { extractArtifactSafely } from "./extract.js";

export { extractArtifactSafely, UnsafeArtifactError } from "./extract.js";

export interface LocalProviderOptions {
  /** Diretório raiz onde os sites são publicados (ex.: var/sites). */
  sitesDir: string;
  /** Base das URLs públicas (ex.: http://localhost:3000). */
  baseUrl: string;
  /**
   * Constrói a URL pública de um site. Default: subdomínio para localhost
   * (http://<slug>.localhost:3000/ — assets absolutos funcionam como em
   * produção) e path /sites/<slug>/ para outros hosts.
   */
  makeUrl?: (slug: string) => string;
}

function defaultMakeUrl(baseUrl: string, slug: string): string {
  try {
    const url = new URL(baseUrl);
    if (url.hostname === "localhost") {
      return `${url.protocol}//${slug}.localhost${url.port ? `:${url.port}` : ""}/`;
    }
  } catch {
    // baseUrl inválida — cai para o formato de path
  }
  return `${baseUrl}/sites/${slug}/`;
}

/**
 * Provider de desenvolvimento: publica artefatos estáticos no filesystem
 * local; o dashboard serve os arquivos em /sites/<slug>/. Implementa o mesmo
 * contrato dos providers reais — o pipeline não sabe a diferença.
 */
export class LocalProvider implements DeploymentProvider {
  readonly slug = "local";
  readonly name = "Local (dev)";
  readonly defaultRegion = "local";
  readonly pricing: ProviderPricingTable = LOCAL_PRICING;

  constructor(private readonly options: LocalProviderOptions) {}

  async deploy(input: DeployInput): Promise<DeployResult> {
    const finalDir = join(this.options.sitesDir, input.projectSlug);
    const stagingDir = join(this.options.sitesDir, `.staging-${input.deploymentId}`);

    try {
      await extractArtifactSafely(input.artifactPath, stagingDir);
      rmSync(finalDir, { recursive: true, force: true });
      mkdirSync(join(finalDir, ".."), { recursive: true });
      renameSync(stagingDir, finalDir);
    } finally {
      rmSync(stagingDir, { recursive: true, force: true });
    }

    const makeUrl =
      this.options.makeUrl ?? ((slug: string) => defaultMakeUrl(this.options.baseUrl, slug));
    return {
      url: makeUrl(input.projectSlug),
      providerRef: `local:${input.projectSlug}`,
      // Subdomínio .localhost não resolve via getaddrinfo no servidor —
      // o health check usa a rota por path, que serve o mesmo conteúdo.
      healthUrl: `${this.options.baseUrl}/sites/${input.projectSlug}/`,
    };
  }

  async destroy(ref: { projectSlug: string; providerRef: string }): Promise<void> {
    rmSync(join(this.options.sitesDir, ref.projectSlug), { recursive: true, force: true });
  }

  async getLogs(): Promise<string[]> {
    // Hosting estático local não produz logs de runtime.
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
    try {
      mkdirSync(this.options.sitesDir, { recursive: true });
      accessSync(this.options.sitesDir, constants.W_OK);
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: `Diretório de sites não é gravável: ${error instanceof Error ? error.message : error}`,
      };
    }
  }
}
