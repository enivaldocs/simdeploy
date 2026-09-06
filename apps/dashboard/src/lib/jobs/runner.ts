import { rmSync } from "node:fs";
import { prisma } from "@simdeploy/db";
import { logger } from "@simdeploy/shared/logger";
import type Stripe from "stripe";
import { audit } from "../audit";
import { getStripe } from "../billing/stripe-client";
import { processStripeEvent } from "../billing/webhook";
import { notify } from "../notifications";
import { usageCollector } from "../usage-collector";

/**
 * Background jobs. Sem infraestrutura de fila ainda: executados por cron
 * externo via POST /api/jobs/run (CRON_SECRET) ou manualmente pelo admin.
 * Todos os jobs são idempotentes — rodar duas vezes não duplica efeito.
 */

export interface JobResult {
  job: string;
  ok: boolean;
  detail: string;
}

function monthPeriod(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

/** Descarrega contadores de uso em memória para o banco. */
async function usageFlush(): Promise<JobResult> {
  await usageCollector().flush();
  return { job: "usage_flush", ok: true, detail: "Contadores descarregados" };
}

/**
 * Registra ProviderCost ACTUAL do mês por projeto ativo. Para o provider
 * local o custo real é zero — registrado como tal (não é estimativa).
 * Providers cloud entram aqui com sync via API de billing do provider.
 */
async function providerCostSync(): Promise<JobResult> {
  const { start, end } = monthPeriod();
  const readyDeployments = await prisma.deployment.findMany({
    where: { status: "READY" },
    distinct: ["projectId"],
    include: { project: true },
  });

  let created = 0;
  for (const deployment of readyDeployments) {
    const plan = deployment.plan as { provider?: string } | null;
    const provider = plan?.provider ?? "local";
    if (provider !== "local") continue; // sync de cloud providers: fase futura
    const existing = await prisma.providerCost.findFirst({
      where: {
        provider: "local",
        projectId: deployment.projectId,
        kind: "ACTUAL",
        periodStart: start,
      },
    });
    if (existing) continue;
    await prisma.providerCost.create({
      data: {
        organizationId: deployment.project.organizationId,
        projectId: deployment.projectId,
        provider: "local",
        kind: "ACTUAL",
        amountMinor: 0,
        currency: "USD",
        periodStart: start,
        periodEnd: end,
        source: "builtin:local-zero-cost",
      },
    });
    created += 1;
  }
  return {
    job: "provider_cost_sync",
    ok: true,
    detail: `${created} registros ACTUAL criados (${readyDeployments.length} projetos ativos)`,
  };
}

/**
 * Reconciliação Stripe ↔ SimDeploy: nunca depender só de webhooks. Compara
 * assinaturas ativas no Stripe com o banco e corrige divergências (auditado).
 */
async function stripeReconciliation(): Promise<JobResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { job: "stripe_reconciliation", ok: true, detail: "Stripe não configurado — skip" };
  }
  const dbSubs = await prisma.subscription.findMany({
    where: { stripeSubscriptionId: { not: null } },
  });
  let checked = 0;
  let fixed = 0;
  for (const dbSub of dbSubs) {
    if (!dbSub.stripeSubscriptionId) continue;
    checked += 1;
    try {
      const remote = await stripe.subscriptions.retrieve(dbSub.stripeSubscriptionId);
      const remoteActive = remote.status === "active" || remote.status === "trialing";
      const localActive = dbSub.status === "ACTIVE" || dbSub.status === "TRIALING";
      if (remoteActive !== localActive) {
        const { processStripeEvent: process } = await import("../billing/webhook");
        await process({
          type: "customer.subscription.updated",
          data: { object: remote },
        } as unknown as Stripe.Event);
        await audit({
          organizationId: dbSub.organizationId,
          action: "reconciliation.subscription_fixed",
          resourceType: "subscription",
          resourceId: dbSub.id,
          before: { status: dbSub.status },
          after: { stripeStatus: remote.status },
        });
        fixed += 1;
      }
    } catch (error) {
      logger.warn("reconciliation_subscription_failed", {
        subscriptionId: dbSub.stripeSubscriptionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  // Descoberta: customers nossos SEM subscription vinculada (checkout
  // completado sem webhook chegar) — importa a assinatura ativa do Stripe.
  let discovered = 0;
  const orphanCustomers = await prisma.subscription.findMany({
    where: { stripeCustomerId: { not: null }, stripeSubscriptionId: null },
  });
  for (const row of orphanCustomers) {
    if (!row.stripeCustomerId) continue;
    try {
      const list = await stripe.subscriptions.list({
        customer: row.stripeCustomerId,
        status: "all",
        limit: 3,
      });
      const active = list.data.find((s) => s.status === "active" || s.status === "trialing");
      if (active) {
        const { processStripeEvent: process } = await import("../billing/webhook");
        await process({
          type: "customer.subscription.updated",
          data: { object: active },
        } as unknown as Stripe.Event);
        await audit({
          organizationId: row.organizationId,
          action: "reconciliation.subscription_discovered",
          resourceType: "subscription",
          resourceId: row.id,
          after: { stripeSubscriptionId: active.id, stripeStatus: active.status },
        });
        discovered += 1;
      }
    } catch (error) {
      logger.warn("reconciliation_discovery_failed", {
        customerId: row.stripeCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    job: "stripe_reconciliation",
    ok: true,
    detail: `${checked} assinaturas verificadas, ${fixed} divergências corrigidas, ${discovered} descobertas via customer`,
  };
}

/** Reprocessa webhooks FAILED recentes (idempotente pelos upserts internos). */
async function webhookRetry(): Promise<JobResult> {
  const failed = await prisma.webhookEvent.findMany({
    where: {
      status: "FAILED",
      attempts: { lt: 5 },
      receivedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    take: 20,
  });
  let recovered = 0;
  for (const event of failed) {
    try {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      await processStripeEvent(event.payload as unknown as Stripe.Event);
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date(), error: null },
      });
      recovered += 1;
    } catch (error) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", error: error instanceof Error ? error.message : String(error) },
      });
    }
  }
  return {
    job: "webhook_retry",
    ok: true,
    detail: `${failed.length} reprocessados, ${recovered} recuperados`,
  };
}

/** Limpeza: sessões expiradas e artefatos de deployments falhos antigos. */
async function cleanup(): Promise<JobResult> {
  const sessions = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  const oldFailed = await prisma.deployment.findMany({
    where: {
      status: { in: ["ANALYSIS_FAILED", "BUILD_FAILED", "DEPLOY_FAILED"] },
      createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      artifactRef: { not: null },
    },
    take: 100,
  });
  let artifactsRemoved = 0;
  for (const deployment of oldFailed) {
    if (!deployment.artifactRef) continue;
    try {
      rmSync(deployment.artifactRef, { force: true });
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: { artifactRef: null },
      });
      artifactsRemoved += 1;
    } catch {
      // arquivo já ausente
    }
  }
  return {
    job: "cleanup",
    ok: true,
    detail: `${sessions.count} sessões expiradas removidas, ${artifactsRemoved} artefatos antigos limpos`,
  };
}

/** Compara uso medido do mês com limites do plano e notifica 80%/100%. */
async function usageLimitCheck(): Promise<JobResult> {
  const { start } = monthPeriod();
  const organizations = await prisma.organization.findMany({
    include: { subscription: { include: { plan: true } }, projects: { select: { id: true } } },
  });
  let notified = 0;
  for (const org of organizations) {
    const limits = (org.subscription?.plan.limits ?? {}) as { bandwidthGb?: number };
    if (!limits.bandwidthGb || org.projects.length === 0) continue;
    const usage = await prisma.usageMetric.aggregate({
      where: {
        projectId: { in: org.projects.map((p) => p.id) },
        metric: "bandwidth_bytes",
        periodStart: { gte: start },
      },
      _sum: { value: true },
    });
    const usedGb = Number(usage._sum.value ?? 0) / (1024 * 1024 * 1024);
    const pct = (usedGb / limits.bandwidthGb) * 100;
    const threshold = pct >= 100 ? "usage_100" : pct >= 80 ? "usage_80" : null;
    if (!threshold) continue;
    const alreadyNotified = await prisma.notification.findFirst({
      where: { organizationId: org.id, type: threshold, createdAt: { gte: start } },
    });
    if (alreadyNotified) continue;
    await notify({
      organizationId: org.id,
      type: threshold,
      title: `Uso de banda em ${Math.round(pct)}% do limite do plano`,
      body: `${usedGb.toFixed(2)} GB de ${limits.bandwidthGb} GB usados neste mês.`,
    });
    notified += 1;
  }
  return { job: "usage_limit_check", ok: true, detail: `${notified} organizações notificadas` };
}

export const JOBS: Record<string, () => Promise<JobResult>> = {
  usage_flush: usageFlush,
  provider_cost_sync: providerCostSync,
  stripe_reconciliation: stripeReconciliation,
  webhook_retry: webhookRetry,
  cleanup: cleanup,
  usage_limit_check: usageLimitCheck,
};

export async function runJobs(only?: string): Promise<JobResult[]> {
  const entries = only ? [[only, JOBS[only]] as const] : Object.entries(JOBS);
  const results: JobResult[] = [];
  for (const [name, job] of entries) {
    if (!job) {
      results.push({ job: name, ok: false, detail: "Job desconhecido" });
      continue;
    }
    try {
      results.push(await job());
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      logger.error("job_failed", { job: name, error: detail });
      results.push({ job: name, ok: false, detail });
    }
  }
  return results;
}
