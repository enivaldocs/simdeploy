import { prisma } from "@simdeploy/db";
import { CloudflareProvider } from "@simdeploy/provider-cloudflare";
import { AdminTable, Stat } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";
import { getStripe } from "@/lib/billing/stripe-client";
import { env, stripeCheckoutAvailable, stripeConfigured } from "@/lib/env";
import { formatDuration } from "@/lib/format";
import { providerRegistry } from "@/lib/services/providers";

type HealthStatus = "Operational" | "Degraded" | "Down" | "Unknown";

interface ComponentHealth {
  name: string;
  status: HealthStatus;
  detail: string;
}

const STATUS_COLOR: Record<HealthStatus, string> = {
  Operational: "text-ok",
  Degraded: "text-warn",
  Down: "text-err",
  Unknown: "text-ink-faint",
};

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "Database",
      status: "Operational",
      detail: `SELECT 1 em ${Date.now() - start}ms`,
    };
  } catch (error) {
    return {
      name: "Database",
      status: "Down",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkStripe(): Promise<ComponentHealth> {
  if (!stripeCheckoutAvailable()) {
    return { name: "Stripe", status: "Unknown", detail: "Não configurado neste ambiente" };
  }
  try {
    const stripe = getStripe();
    if (!stripe) throw new Error("cliente indisponível");
    const start = Date.now();
    await stripe.balance.retrieve();
    const latency = Date.now() - start;
    if (!stripeConfigured()) {
      return {
        name: "Stripe",
        status: "Degraded",
        detail: `API OK em ${latency}ms; STRIPE_WEBHOOK_SECRET ausente — confirmações dependem da reconciliação periódica`,
      };
    }
    return { name: "Stripe", status: "Operational", detail: `API em ${latency}ms` };
  } catch (error) {
    return {
      name: "Stripe",
      status: "Down",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkCloudflare(): Promise<ComponentHealth> {
  const e = env();
  if (!e.CLOUDFLARE_API_TOKEN || !e.CLOUDFLARE_ACCOUNT_ID) {
    return { name: "Cloudflare", status: "Unknown", detail: "Credenciais não configuradas" };
  }
  const provider = new CloudflareProvider({
    apiToken: e.CLOUDFLARE_API_TOKEN,
    accountId: e.CLOUDFLARE_ACCOUNT_ID,
  });
  const health = await provider.healthCheck();
  return {
    name: "Cloudflare",
    status: health.healthy ? "Operational" : "Down",
    detail: health.message ?? "Token verificado",
  };
}

export default async function AdminSystemPage() {
  await requireStaff("system");
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [db, stripe, cloudflare, registryHealth, total24h, failed24h, avgDuration, webhookFails] =
    await Promise.all([
      checkDatabase(),
      checkStripe(),
      checkCloudflare(),
      Promise.all(
        providerRegistry()
          .list()
          .map(async (provider) => ({ slug: provider.slug, health: await provider.healthCheck() })),
      ),
      prisma.deployment.count({ where: { createdAt: { gte: since24h } } }),
      prisma.deployment.count({
        where: {
          createdAt: { gte: since24h },
          status: { in: ["ANALYSIS_FAILED", "BUILD_FAILED", "DEPLOY_FAILED"] },
        },
      }),
      prisma.deployment.aggregate({
        where: { createdAt: { gte: since24h }, durationMs: { not: null } },
        _avg: { durationMs: true },
      }),
      prisma.webhookEvent.count({ where: { status: "FAILED", receivedAt: { gte: since24h } } }),
    ]);

  const successRate = total24h > 0 ? ((total24h - failed24h) / total24h) * 100 : null;
  const deployEngine: ComponentHealth = {
    name: "Deploy engine",
    status: successRate === null ? "Unknown" : successRate >= 90 ? "Operational" : "Degraded",
    detail:
      successRate === null
        ? "Sem deployments nas últimas 24h"
        : `${Math.round(successRate * 10) / 10}% de sucesso (${total24h} deploys/24h)`,
  };
  const webhooks: ComponentHealth = {
    name: "Webhooks",
    status: webhookFails === 0 ? "Operational" : "Degraded",
    detail: `${webhookFails} falhas nas últimas 24h`,
  };
  const queue: ComponentHealth = {
    name: "Queue",
    status: "Unknown",
    detail: "Pipeline roda síncrono na request (fila planejada — ver ROADMAP)",
  };
  const mcp: ComponentHealth = {
    name: "MCP",
    status: "Unknown",
    detail: "Processo stdio do lado do cliente — não monitorável pelo servidor",
  };

  const components: ComponentHealth[] = [
    db,
    stripe,
    cloudflare,
    ...registryHealth.map((r) => ({
      name: `Provider: ${r.slug}`,
      status: (r.health.healthy ? "Operational" : "Down") as HealthStatus,
      detail: r.health.message ?? "healthCheck OK",
    })),
    deployEngine,
    webhooks,
    queue,
    mcp,
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-xl font-medium">System health</h1>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat label="Deployments (24h)" value={String(total24h)} />
        <Stat
          label="Success rate (24h)"
          value={successRate === null ? "No data" : `${Math.round(successRate * 10) / 10}%`}
        />
        <Stat
          label="Avg deploy duration (24h)"
          value={
            avgDuration._avg.durationMs === null
              ? "No data"
              : formatDuration(Math.round(avgDuration._avg.durationMs))
          }
        />
      </div>

      <AdminTable headers={["Component", "Status", "Detail"]}>
        {components.map((component) => (
          <tr key={component.name} className="border-b border-edge-soft last:border-0">
            <td className="px-4 py-2.5 text-sm">{component.name}</td>
            <td className={`px-4 py-2.5 text-sm ${STATUS_COLOR[component.status]}`}>
              {component.status}
            </td>
            <td className="px-4 py-2.5 text-xs text-ink-faint">{component.detail}</td>
          </tr>
        ))}
      </AdminTable>
      <p className="mt-4 text-xs text-ink-faint">
        Latência de API por rota: No data — instrumentação por rota entra com o coletor de métricas
        (ver docs/operations.md).
      </p>
    </div>
  );
}
