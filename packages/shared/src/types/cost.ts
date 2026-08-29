import { z } from "zod";
import { architectureTypeSchema } from "./analysis.js";

/**
 * Recursos cobráveis que o CostEngine entende. Tabelas de preço de qualquer
 * provider são expressas nesses termos — a lógica de cálculo nunca conhece
 * preços, só consome tabelas.
 */
export const RESOURCE_KINDS = [
  "requests",
  "bandwidth_gb",
  "storage_gb",
  "build_minute",
  "function_invocation",
  "function_gb_second",
  "static_hosting_flat",
  "platform_flat",
] as const;
export const resourceKindSchema = z.enum(RESOURCE_KINDS);
export type ResourceKind = z.infer<typeof resourceKindSchema>;

export const pricingResourceSchema = z.object({
  resource: resourceKindSchema,
  unit: z.string(),
  /** Preço por unidade em USD. */
  pricePerUnit: z.number().nonnegative(),
  /** Unidades incluídas de graça por mês. */
  freeAllowance: z.number().nonnegative(),
  /** Arquiteturas às quais este item se aplica. */
  architectures: z.array(architectureTypeSchema),
  notes: z.string().optional(),
});
export type PricingResource = z.infer<typeof pricingResourceSchema>;

export const providerPricingTableSchema = z.object({
  provider: z.string(),
  currency: z.literal("USD"),
  /** Data do snapshot da tabela pública do provider. */
  updatedAt: z.string(),
  /** URL da tabela de preços pública de onde os valores vieram. */
  source: z.string(),
  /** Arquiteturas que o provider consegue hospedar. */
  supportedArchitectures: z.array(architectureTypeSchema),
  resources: z.array(pricingResourceSchema),
});
export type ProviderPricingTable = z.infer<typeof providerPricingTableSchema>;

/** Premissas de uso mensal usadas na projeção de custo. */
export const expectedUsageSchema = z.object({
  monthlyRequests: z.number().nonnegative(),
  monthlyBandwidthGb: z.number().nonnegative(),
  storageGb: z.number().nonnegative(),
  buildMinutesPerMonth: z.number().nonnegative(),
  avgFunctionDurationMs: z.number().nonnegative(),
  functionMemoryMb: z.number().positive(),
});
export type ExpectedUsage = z.infer<typeof expectedUsageSchema>;

export const costBreakdownLineSchema = z.object({
  resource: resourceKindSchema,
  unit: z.string(),
  quantity: z.number(),
  freeAllowance: z.number(),
  billableQuantity: z.number(),
  pricePerUnit: z.number(),
  costUsd: z.number(),
});
export type CostBreakdownLine = z.infer<typeof costBreakdownLineSchema>;

export const architectureCostEstimateSchema = z.object({
  provider: z.string(),
  architecture: architectureTypeSchema,
  compatible: z.boolean(),
  incompatibilityReasons: z.array(z.string()),
  monthlyUsd: z.number(),
  breakdown: z.array(costBreakdownLineSchema),
  assumptions: expectedUsageSchema,
});
export type ArchitectureCostEstimate = z.infer<typeof architectureCostEstimateSchema>;

export const costRecommendationSchema = z.object({
  recommended: architectureCostEstimateSchema,
  alternatives: z.array(architectureCostEstimateSchema),
  currency: z.literal("USD"),
  /**
   * Sempre presente: valores são projeções baseadas em premissas de uso e
   * tabelas públicas de preço — nunca apresentar como custo real medido.
   */
  disclaimer: z.string(),
});
export type CostRecommendation = z.infer<typeof costRecommendationSchema>;
