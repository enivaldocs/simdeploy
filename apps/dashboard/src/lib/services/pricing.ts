import { DEFAULT_PRICING_TABLES } from "@autocloud/cost-engine";
import { prisma } from "@autocloud/db";
import {
  type ArchitectureType,
  architectureTypeSchema,
  type ProviderPricingTable,
  resourceKindSchema,
} from "@autocloud/shared";

/**
 * Fonte da verdade de pricing em produção: tabela ProviderPricing.
 * Reconstrói ProviderPricingTable[] para o CostEngine; cai para o snapshot
 * default se o banco ainda não foi seedado.
 */
export async function loadPricingTables(): Promise<ProviderPricingTable[]> {
  const providers = await prisma.provider.findMany({ include: { pricing: true } });
  const tables: ProviderPricingTable[] = [];

  for (const provider of providers) {
    if (provider.pricing.length === 0) continue;
    const architectures = new Set<ArchitectureType>();
    const resources = [];

    for (const row of provider.pricing) {
      const parsedKind = resourceKindSchema.safeParse(row.resource);
      if (!parsedKind.success) continue;
      const metadata = (row.metadata ?? {}) as {
        architectures?: string[];
        notes?: string | null;
        source?: string;
      };
      const archs = (metadata.architectures ?? [])
        .map((a) => architectureTypeSchema.safeParse(a))
        .filter((r) => r.success)
        .map((r) => r.data);
      for (const arch of archs) architectures.add(arch);
      resources.push({
        resource: parsedKind.data,
        unit: row.unit,
        pricePerUnit: Number(row.pricePerUnit),
        freeAllowance: Number(row.freeAllowance),
        architectures: archs,
        notes: metadata.notes ?? undefined,
      });
    }

    tables.push({
      provider: provider.slug,
      currency: "USD",
      updatedAt: provider.pricing[0]?.effectiveAt.toISOString().slice(0, 10) ?? "",
      source: ((provider.pricing[0]?.metadata ?? {}) as { source?: string }).source ?? "database",
      supportedArchitectures: [...architectures],
      resources,
    });
  }

  return tables.length > 0 ? tables : DEFAULT_PRICING_TABLES;
}
