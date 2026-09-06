import { prisma } from "@simdeploy/db";
import type { NextRequest } from "next/server";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/respond";
import { getCreditBalance } from "@/lib/billing/ledger";
import { ensureSubscriptionRow } from "@/lib/billing/service";

/** Resumo de billing da organização (scope billing:read). */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "billing:read");
    const orgId = auth.organization.id;

    await ensureSubscriptionRow(orgId);
    const [subscription, payments, invoices, creditBalanceMinor] = await Promise.all([
      prisma.subscription.findUnique({ where: { organizationId: orgId }, include: { plan: true } }),
      prisma.payment.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      getCreditBalance(orgId),
    ]);

    return ok({
      plan: subscription
        ? {
            slug: subscription.plan.slug,
            name: subscription.plan.name,
            priceMonthlyMinor: subscription.plan.priceMonthlyMinor,
            currency: subscription.plan.currency,
            limits: subscription.plan.limits,
          }
        : null,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      creditBalanceMinor,
      creditCurrency: "BRL",
      payments: payments.map((p) => ({
        id: p.id,
        amountMinor: p.amountMinor,
        currency: p.currency,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        number: i.number,
        amountDueMinor: i.amountDueMinor,
        amountPaidMinor: i.amountPaidMinor,
        currency: i.currency,
        status: i.status,
        hostedInvoiceUrl: i.hostedInvoiceUrl,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
