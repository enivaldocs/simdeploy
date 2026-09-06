import { PrismaClient } from "@prisma/client";
import { DEFAULT_PRICING_TABLES } from "@simdeploy/cost-engine";

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
    priceMonthlyMinor: 0,
    priceAnnualMinor: null,
    sortOrder: 0,
    limits: {
      maxProjects: 2,
      maxDeploymentsPerDay: 10,
      customDomains: false,
      bandwidthGb: 10,
      buildMinutes: 100,
      storageGb: 1,
      includedCreditsMinor: 0,
    },
  },
  {
    slug: "pro",
    name: "Pro",
    priceMonthlyMinor: 2900,
    priceAnnualMinor: 29000,
    sortOrder: 1,
    limits: {
      maxProjects: 10,
      maxDeploymentsPerDay: 100,
      customDomains: true,
      bandwidthGb: 100,
      buildMinutes: 1000,
      storageGb: 10,
      includedCreditsMinor: 0,
    },
  },
  {
    slug: "builder",
    name: "Builder",
    priceMonthlyMinor: 5900,
    priceAnnualMinor: 59000,
    sortOrder: 2,
    limits: {
      maxProjects: 30,
      maxDeploymentsPerDay: 300,
      customDomains: true,
      bandwidthGb: 500,
      buildMinutes: 3000,
      storageGb: 50,
      includedCreditsMinor: 0,
    },
  },
  {
    slug: "agency",
    name: "Agency",
    priceMonthlyMinor: 14900,
    priceAnnualMinor: 149000,
    sortOrder: 3,
    limits: {
      maxProjects: 100,
      maxDeploymentsPerDay: 1000,
      customDomains: true,
      bandwidthGb: 2000,
      buildMinutes: 10000,
      storageGb: 200,
      includedCreditsMinor: 0,
    },
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
        currency: "BRL",
        priceMonthlyMinor: plan.priceMonthlyMinor,
        priceAnnualMinor: plan.priceAnnualMinor,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
      },
      update: {
        name: plan.name,
        currency: "BRL",
        priceMonthlyMinor: plan.priceMonthlyMinor,
        priceAnnualMinor: plan.priceAnnualMinor,
        limits: plan.limits,
      },
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
