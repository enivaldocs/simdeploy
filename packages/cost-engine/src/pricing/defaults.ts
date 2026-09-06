import type { ProviderPricingTable } from "@simdeploy/shared";

/**
 * Snapshots default de tabelas públicas de preço. São CONFIGURAÇÃO, não
 * lógica: em produção a fonte da verdade é a tabela ProviderPricing no banco
 * (seedada a partir daqui e atualizável sem deploy). A CLI usa estes snapshots
 * para o modo offline (simdeploy analyze sem login).
 *
 * Cada tabela carrega `updatedAt` e `source` — os valores devem ser conferidos
 * e reajustados periodicamente contra a fonte.
 */

export const CLOUDFLARE_PRICING: ProviderPricingTable = {
  provider: "cloudflare",
  currency: "USD",
  updatedAt: "2026-08-29",
  source: "https://developers.cloudflare.com/workers/platform/pricing/",
  supportedArchitectures: ["static", "edge", "serverless", "hybrid"],
  resources: [
    {
      resource: "static_hosting_flat",
      unit: "month",
      pricePerUnit: 0,
      freeAllowance: 0,
      architectures: ["static", "edge"],
      notes: "Assets estáticos (Workers Static Assets/Pages): sem cobrança por request.",
    },
    {
      resource: "platform_flat",
      unit: "month",
      pricePerUnit: 5,
      freeAllowance: 0,
      architectures: ["serverless", "hybrid"],
      notes:
        "Plano Workers Paid (USD 5/mês, inclui 10M requests). Projetos pequenos podem caber no free tier (100k req/dia) e zerar este custo.",
    },
    {
      resource: "requests",
      unit: "request",
      pricePerUnit: 0.0000003,
      freeAllowance: 10_000_000,
      architectures: ["serverless", "hybrid"],
      notes: "USD 0.30 por milhão de requests a funções acima dos 10M inclusos no plano.",
    },
    {
      resource: "bandwidth_gb",
      unit: "GB",
      pricePerUnit: 0,
      freeAllowance: 0,
      architectures: ["static", "edge", "serverless", "hybrid"],
      notes: "Cloudflare não cobra egress.",
    },
    {
      resource: "storage_gb",
      unit: "GB-month",
      pricePerUnit: 0.015,
      freeAllowance: 10,
      architectures: ["static", "edge", "serverless", "hybrid"],
      notes: "R2 storage: 10 GB grátis, USD 0.015/GB-mês acima.",
    },
    {
      resource: "build_minute",
      unit: "minute",
      pricePerUnit: 0,
      freeAllowance: 0,
      architectures: ["static", "edge", "serverless", "hybrid"],
      notes: "No MVP o build roda na máquina do usuário (CLI) — sem custo de build remoto.",
    },
  ],
};

/** Provider de desenvolvimento: serve artefatos localmente, custo zero. */
export const LOCAL_PRICING: ProviderPricingTable = {
  provider: "local",
  currency: "USD",
  updatedAt: "2026-08-29",
  source: "builtin",
  supportedArchitectures: ["static"],
  resources: [
    {
      resource: "static_hosting_flat",
      unit: "month",
      pricePerUnit: 0,
      freeAllowance: 0,
      architectures: ["static"],
      notes: "Provider local de desenvolvimento — sem custo.",
    },
  ],
};

/**
 * Referência de VPS para a arquitetura node-server (sem adapter de deploy
 * ainda — usada só para comparação de custo).
 */
export const HETZNER_REFERENCE_PRICING: ProviderPricingTable = {
  provider: "hetzner",
  currency: "USD",
  updatedAt: "2026-08-29",
  source: "https://www.hetzner.com/cloud",
  supportedArchitectures: ["node-server"],
  resources: [
    {
      resource: "platform_flat",
      unit: "month",
      pricePerUnit: 4.59,
      freeAllowance: 0,
      architectures: ["node-server"],
      notes: "VPS CX22 (2 vCPU / 4 GB) — aproximação em USD do preço em EUR; conferir na fonte.",
    },
    {
      resource: "bandwidth_gb",
      unit: "GB",
      pricePerUnit: 0.0011,
      freeAllowance: 20_000,
      architectures: ["node-server"],
      notes: "20 TB inclusos; ~USD 1.1/TB excedente (aprox. de EUR 1/TB).",
    },
    {
      resource: "storage_gb",
      unit: "GB-month",
      pricePerUnit: 0,
      freeAllowance: 40,
      architectures: ["node-server"],
      notes: "40 GB de disco inclusos no plano.",
    },
  ],
};

export const DEFAULT_PRICING_TABLES: ProviderPricingTable[] = [
  CLOUDFLARE_PRICING,
  LOCAL_PRICING,
  HETZNER_REFERENCE_PRICING,
];
