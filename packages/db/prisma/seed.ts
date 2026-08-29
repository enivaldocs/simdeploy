import { DEFAULT_PRICING_TABLES } from "@autocloud/cost-engine";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Providers com adapter de deploy funcional hoje. */
const DEPLOYABLE_PROVIDERS = new Set(["local", "cloudflare"]);

const PROVIDER_NAMES: Record<string, string> = {
  local: "Local (dev)",
  cloudflare: "Cloudflare",
  hetzner: "Hetzner (referência de custo)",
};

/**
 * Planos são CONFIGURAÇÃO: valores vivem no banco e podem mudar sem deploy.
 * Limites em JSON para evoluir sem migração.
 */
const PLANS = [
  {
    slug: "free",
    name: "Free",
    priceBrl: "0",
    sortOrder: 0,
    limits: { maxProjects: 2, maxDeploymentsPerDay: 10, customDomains: false },
  },
  {
    slug: "pro",
    name: "Pro",
    priceBrl: "29",
    sortOrder: 1,
    limits: { maxProjects: 10, maxDeploymentsPerDay: 100, customDomains: true },
  },
  {
    slug: "builder",
    name: "Builder",
    priceBrl: "59",
    sortOrder: 2,
    limits: { maxProjects: 30, maxDeploymentsPerDay: 300, customDomains: true },
  },
  {
    slug: "agency",
    name: "Agency",
    priceBrl: "149",
    sortOrder: 3,
    limits: { maxProjects: 100, maxDeploymentsPerDay: 1000, customDomains: true },
  },
];

async function main(): Promise<void> {
  for (const table of DEFAULT_PRICING_TABLES) {
    const provider = await prisma.provider.upsert({
      where: { slug: table.provider },
      create: {
        slug: table.provider,
        name: PROVIDER_NAMES[table.provider] ?? table.provider,
        active: DEPLOYABLE_PROVIDERS.has(table.provider),
      },
      update: { active: DEPLOYABLE_PROVIDERS.has(table.provider) },
    });

    for (const resource of table.resources) {
      await prisma.providerPricing.upsert({
        where: {
          providerId_resource: { providerId: provider.id, resource: resource.resource },
        },
        create: {
          providerId: provider.id,
          resource: resource.resource,
          unit: resource.unit,
          pricePerUnit: resource.pricePerUnit.toString(),
          currency: table.currency,
          freeAllowance: resource.freeAllowance.toString(),
          metadata: {
            architectures: resource.architectures,
            notes: resource.notes ?? null,
            source: table.source,
          },
          effectiveAt: new Date(table.updatedAt),
        },
        update: {
          unit: resource.unit,
          pricePerUnit: resource.pricePerUnit.toString(),
          freeAllowance: resource.freeAllowance.toString(),
          metadata: {
            architectures: resource.architectures,
            notes: resource.notes ?? null,
            source: table.source,
          },
          effectiveAt: new Date(table.updatedAt),
        },
      });
    }
    console.log(`Provider seedado: ${table.provider} (${table.resources.length} itens de pricing)`);
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        priceBrl: plan.priceBrl,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
      },
      update: { name: plan.name, priceBrl: plan.priceBrl, limits: plan.limits },
    });
  }
  console.log(`Planos seedados: ${PLANS.map((p) => p.slug).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
