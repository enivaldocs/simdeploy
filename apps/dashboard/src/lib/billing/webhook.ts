import { prisma, type SubscriptionStatus } from "@autocloud/db";
import type Stripe from "stripe";
import { trackEvent } from "../analytics";
import { env } from "../env";
import { notify } from "../notifications";
import { addLedgerEntry } from "./ledger";
import { requireStripe } from "./stripe-client";

/**
 * Processamento robusto de webhooks Stripe:
 * - assinatura validada (constructEvent) ANTES de qualquer efeito;
 * - dedup por (provider, eventId) na tabela WebhookEvent;
 * - idempotência: eventos PROCESSED/SKIPPED nunca reprocessam;
 * - retry: falha grava FAILED + retorna 500 (o Stripe reenvia; attempts++).
 */

import { shouldProcessWebhook } from "./webhook-rules";

export { shouldProcessWebhook };

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
]);

export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<{ received: true; action: "processed" | "skipped" | "ignored" }> {
  const stripe = requireStripe();
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET ausente");

  // Lança em assinatura inválida — o chamador responde 400.
  const event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);

  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "stripe", eventId: event.id } },
  });
  if (shouldProcessWebhook(existing) === "skip") {
    return { received: true, action: "skipped" };
  }

  const record = await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: "stripe", eventId: event.id } },
    create: {
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      status: "PROCESSING",
      attempts: 1,
      payload: event as unknown as object,
    },
    update: { status: "PROCESSING", attempts: { increment: 1 } },
  });

  if (!RELEVANT_EVENTS.has(event.type)) {
    await prisma.webhookEvent.update({
      where: { id: record.id },
      data: { status: "SKIPPED", processedAt: new Date() },
    });
    return { received: true, action: "ignored" };
  }

  try {
    await processStripeEvent(event);
    await prisma.webhookEvent.update({
      where: { id: record.id },
      data: { status: "PROCESSED", processedAt: new Date(), error: null },
    });
    return { received: true, action: "processed" };
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: record.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

// ---------------------------------------------------------------
// Handlers por tipo de evento
// ---------------------------------------------------------------

async function resolveOrganizationId(input: {
  metadataOrgId?: string | null;
  stripeCustomerId?: string | null;
}): Promise<string | null> {
  if (input.metadataOrgId) return input.metadataOrgId;
  if (input.stripeCustomerId) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: input.stripeCustomerId },
    });
    return subscription?.organizationId ?? null;
  }
  return null;
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "PAST_DUE",
  incomplete_expired: "CANCELED",
};

/** Período da subscription — defensivo entre versões da API Stripe. */
function subscriptionPeriod(sub: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number })
    | undefined;
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const start = item?.current_period_start ?? legacy.current_period_start;
  const end = item?.current_period_end ?? legacy.current_period_end;
  return {
    start: start ? new Date(start * 1000) : null,
    end: end ? new Date(end * 1000) : null,
  };
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const organizationId = await resolveOrganizationId({
    metadataOrgId: sub.metadata?.organizationId,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
  });
  if (!organizationId) {
    throw new Error(`Subscription ${sub.id} sem organização identificável`);
  }

  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const plan = priceId
    ? await prisma.plan.findFirst({
        where: { OR: [{ stripePriceMonthlyId: priceId }, { stripePriceAnnualId: priceId }] },
      })
    : null;

  const period = subscriptionPeriod(sub);
  const status = STATUS_MAP[sub.status] ?? "PAST_DUE";

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId: plan?.id ?? (await requireFreePlanId()),
      status,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    update: {
      ...(plan ? { planId: plan.id } : {}),
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });
}

async function requireFreePlanId(): Promise<string> {
  const free = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (!free) throw new Error("Plano free não seedado");
  return free.id;
}

async function handleInvoice(invoice: Stripe.Invoice, paid: boolean): Promise<void> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const organizationId = await resolveOrganizationId({ stripeCustomerId: customerId });
  if (!organizationId) throw new Error(`Invoice ${invoice.id} sem organização identificável`);

  const invoiceRow = await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id as string },
    create: {
      organizationId,
      stripeInvoiceId: invoice.id as string,
      number: invoice.number,
      amountDueMinor: invoice.amount_due ?? 0,
      amountPaidMinor: invoice.amount_paid ?? 0,
      currency: (invoice.currency ?? "brl").toUpperCase(),
      status: invoice.status ?? (paid ? "paid" : "open"),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      paidAt: paid ? new Date() : null,
    },
    update: {
      amountPaidMinor: invoice.amount_paid ?? 0,
      status: invoice.status ?? (paid ? "paid" : "open"),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      paidAt: paid ? new Date() : null,
    },
  });

  const paymentIntentId =
    (invoice as unknown as { payment_intent?: string | { id: string } }).payment_intent ?? null;
  const piId =
    typeof paymentIntentId === "string" ? paymentIntentId : (paymentIntentId?.id ?? null);

  const hadFailedBefore =
    paid &&
    (await prisma.payment.findFirst({
      where: { organizationId, status: "FAILED" },
      orderBy: { createdAt: "desc" },
    })) !== null;

  if (piId) {
    await prisma.payment.upsert({
      where: { stripePaymentIntentId: piId },
      create: {
        organizationId,
        amountMinor: paid ? (invoice.amount_paid ?? 0) : (invoice.amount_due ?? 0),
        currency: (invoice.currency ?? "brl").toUpperCase(),
        status: paid ? "SUCCEEDED" : "FAILED",
        stripePaymentIntentId: piId,
        invoiceId: invoiceRow.id,
        description: `Invoice ${invoice.number ?? invoice.id}`,
      },
      update: { status: paid ? "SUCCEEDED" : "FAILED", invoiceId: invoiceRow.id },
    });
  } else {
    await prisma.payment.create({
      data: {
        organizationId,
        amountMinor: paid ? (invoice.amount_paid ?? 0) : (invoice.amount_due ?? 0),
        currency: (invoice.currency ?? "brl").toUpperCase(),
        status: paid ? "SUCCEEDED" : "FAILED",
        invoiceId: invoiceRow.id,
        description: `Invoice ${invoice.number ?? invoice.id}`,
      },
    });
  }

  if (paid) {
    await grantIncludedCredits(organizationId, invoiceRow.id);
    await trackEvent({
      name: hadFailedBefore ? "payment_recovered" : "subscription_started",
      organizationId,
      properties: { invoiceId: invoiceRow.id, amountMinor: invoice.amount_paid },
    });
    if (hadFailedBefore) {
      await notify({
        organizationId,
        type: "payment_recovered",
        title: "Pagamento regularizado",
        metadata: { invoiceId: invoiceRow.id },
      });
    }
  } else {
    await trackEvent({
      name: "payment_failed",
      organizationId,
      properties: { invoiceId: invoiceRow.id, amountMinor: invoice.amount_due },
    });
    await notify({
      organizationId,
      type: "payment_failed",
      title: "Falha no pagamento da assinatura",
      body: "Atualize o método de pagamento para manter os deployments ativos.",
      metadata: { invoiceId: invoiceRow.id },
    });
  }
}

/** Créditos inclusos no plano viram entrada de ledger a cada fatura paga. */
async function grantIncludedCredits(organizationId: string, invoiceId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  const limits = (subscription?.plan.limits ?? {}) as { includedCreditsMinor?: number };
  const included = limits.includedCreditsMinor ?? 0;
  if (included > 0) {
    await addLedgerEntry({
      organizationId,
      amountMinor: included,
      currency: subscription?.plan.currency ?? "BRL",
      type: "SUBSCRIPTION",
      reason: `Créditos inclusos no plano ${subscription?.plan.slug}`,
      source: `stripe:${invoiceId}`,
    });
  }
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = await resolveOrganizationId({
        metadataOrgId: session.metadata?.organizationId,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : session.customer?.id,
      });
      if (organizationId) {
        await trackEvent({
          name: "subscription_started",
          organizationId,
          properties: { checkoutSessionId: session.id, planSlug: session.metadata?.planSlug },
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      const organizationId = await resolveOrganizationId({
        metadataOrgId: sub.metadata?.organizationId,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      });
      if (organizationId) {
        await trackEvent({ name: "subscription_canceled", organizationId });
        await notify({
          organizationId,
          type: "subscription_canceled",
          title: "Assinatura cancelada",
        });
      }
      break;
    }
    case "invoice.paid":
      await handleInvoice(event.data.object as Stripe.Invoice, true);
      break;
    case "invoice.payment_failed":
      await handleInvoice(event.data.object as Stripe.Invoice, false);
      break;
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
      if (piId) {
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: piId },
          data: { status: "REFUNDED", stripeChargeId: charge.id },
        });
      }
      break;
    }
    default:
      break;
  }
}
