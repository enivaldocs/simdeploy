import { type Organization, type Plan, prisma } from "@simdeploy/db";
import { trackEvent } from "../analytics";
import { env } from "../env";
import { requireStripe } from "./stripe-client";

/**
 * Operações de billing do lado autenticado: checkout, portal, customer.
 * A CONFIRMAÇÃO de pagamento nunca vem do frontend — só do webhook Stripe.
 */

export async function ensureSubscriptionRow(organizationId: string) {
  const existing = await prisma.subscription.findUnique({ where: { organizationId } });
  if (existing) return existing;
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (!freePlan) throw new Error("Plano free não seedado");
  return prisma.subscription.create({
    data: { organizationId, planId: freePlan.id, status: "ACTIVE" },
  });
}

/** Garante Customer no Stripe vinculado à organização. */
export async function ensureStripeCustomer(
  organization: Organization,
  email: string,
): Promise<string> {
  const stripe = requireStripe();
  const subscription = await ensureSubscriptionRow(organization.id);
  if (subscription.stripeCustomerId) return subscription.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name: organization.name,
    metadata: { organizationId: organization.id, organizationSlug: organization.slug },
  });
  await prisma.subscription.update({
    where: { organizationId: organization.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/**
 * Garante Product/Price do plano no Stripe (auto-provisionado na primeira
 * necessidade e persistido no Plan — sem configuração manual).
 */
export async function ensureStripePrice(
  plan: Plan,
  interval: "monthly" | "annual",
): Promise<string> {
  const stripe = requireStripe();
  const existing = interval === "monthly" ? plan.stripePriceMonthlyId : plan.stripePriceAnnualId;
  if (existing) return existing;

  const amountMinor = interval === "monthly" ? plan.priceMonthlyMinor : plan.priceAnnualMinor;
  if (!amountMinor || amountMinor <= 0) {
    throw new Error(`Plano ${plan.slug} não tem preço ${interval} configurado`);
  }

  let productId = plan.stripeProductId;
  if (!productId) {
    const product = await stripe.products.create({
      name: `SimDeploy ${plan.name}`,
      metadata: { planSlug: plan.slug },
    });
    productId = product.id;
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amountMinor,
    currency: plan.currency.toLowerCase(),
    recurring: { interval: interval === "monthly" ? "month" : "year" },
    metadata: { planSlug: plan.slug, interval },
  });

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      stripeProductId: productId,
      ...(interval === "monthly"
        ? { stripePriceMonthlyId: price.id }
        : { stripePriceAnnualId: price.id }),
    },
  });
  return price.id;
}

export async function createCheckoutSession(input: {
  organization: Organization;
  userId: string;
  email: string;
  planSlug: string;
  interval: "monthly" | "annual";
}): Promise<{ url: string }> {
  const stripe = requireStripe();
  const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
  if (!plan?.active) throw new Error(`Plano inexistente: ${input.planSlug}`);
  if (plan.priceMonthlyMinor === 0) throw new Error("Plano free não passa por checkout");

  const customerId = await ensureStripeCustomer(input.organization, input.email);
  const priceId = await ensureStripePrice(plan, input.interval);
  const appUrl = env().APP_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=canceled`,
    metadata: { organizationId: input.organization.id, planSlug: plan.slug },
    subscription_data: {
      metadata: { organizationId: input.organization.id, planSlug: plan.slug },
    },
  });
  if (!session.url) throw new Error("Stripe não retornou URL de checkout");

  await trackEvent({
    name: "checkout_started",
    userId: input.userId,
    organizationId: input.organization.id,
    properties: { planSlug: plan.slug, interval: input.interval },
  });
  return { url: session.url };
}

export async function createPortalSession(organization: Organization): Promise<{ url: string }> {
  const stripe = requireStripe();
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
  });
  if (!subscription?.stripeCustomerId) {
    throw new Error("Organização ainda não tem customer no Stripe");
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env().APP_URL}/dashboard/billing`,
  });
  return { url: session.url };
}
