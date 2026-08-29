import { prisma } from "@autocloud/db";
import { formatMinor } from "@autocloud/finance";
import { trackEvent } from "@/lib/analytics";
import { getSession } from "@/lib/auth/session";
import { getCreditBalance } from "@/lib/billing/ledger";
import { ensureSubscriptionRow } from "@/lib/billing/service";
import { stripeConfigured } from "@/lib/env";
import { PortalButton, UpgradeButton } from "./billing-actions";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.organization.id;

  await ensureSubscriptionRow(orgId);
  const [subscription, plans, payments, invoices, creditBalanceMinor] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: orgId }, include: { plan: true } }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.payment.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getCreditBalance(orgId),
  ]);
  await trackEvent({ name: "billing_viewed", userId: session.user.id, organizationId: orgId });

  const stripeOn = stripeConfigured();
  const currentPlan = subscription?.plan;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-xl font-medium">Billing</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-edge bg-panel p-5">
          <p className="text-xs text-ink-faint">Current plan</p>
          <p className="mt-1 text-lg font-medium">{currentPlan?.name ?? "—"}</p>
          <p className="font-mono text-sm text-ink-dim">
            {currentPlan
              ? currentPlan.priceMonthlyMinor === 0
                ? "R$ 0/mês"
                : `${formatMinor(currentPlan.priceMonthlyMinor, currentPlan.currency)}/mês`
              : ""}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            status: {subscription?.status ?? "—"}
            {subscription?.cancelAtPeriodEnd ? " (cancela no fim do período)" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-5">
          <p className="text-xs text-ink-faint">Credit balance</p>
          <p className="mt-1 font-mono text-lg">{formatMinor(creditBalanceMinor, "BRL")}</p>
          <p className="mt-1 text-xs text-ink-faint">saldo derivado do ledger</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-5">
          <p className="text-xs text-ink-faint">Next renewal</p>
          <p className="mt-1 font-mono text-lg">
            {subscription?.currentPeriodEnd
              ? subscription.currentPeriodEnd.toISOString().slice(0, 10)
              : "—"}
          </p>
          {subscription?.stripeCustomerId && stripeOn ? (
            <div className="mt-2">
              <PortalButton />
            </div>
          ) : null}
        </div>
      </div>

      {!stripeOn ? (
        <p className="mb-8 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          Pagamento online indisponível neste ambiente (Stripe não configurado). Os planos abaixo
          são exibidos com os valores reais configurados no sistema.
        </p>
      ) : null}

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Plans</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border bg-panel p-4 ${
              plan.id === currentPlan?.id ? "border-accent" : "border-edge"
            }`}
          >
            <p className="font-medium">{plan.name}</p>
            <p className="font-mono text-sm text-ink-dim">
              {plan.priceMonthlyMinor === 0
                ? "R$ 0/mês"
                : `${formatMinor(plan.priceMonthlyMinor, plan.currency)}/mês`}
            </p>
            <div className="mt-3">
              {plan.id === currentPlan?.id ? (
                <span className="text-xs text-accent">Current plan</span>
              ) : plan.priceMonthlyMinor > (currentPlan?.priceMonthlyMinor ?? 0) ? (
                <UpgradeButton planSlug={plan.slug} planName={plan.name} disabled={!stripeOn} />
              ) : (
                <span className="text-xs text-ink-faint">
                  {stripeOn ? "Downgrade via portal" : "—"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Payments</h2>
          <div className="overflow-hidden rounded-lg border border-edge">
            {payments.length === 0 ? (
              <p className="bg-panel p-4 text-sm text-ink-faint">No payments yet.</p>
            ) : (
              <table className="w-full bg-panel text-sm">
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-edge-soft last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {formatMinor(payment.amountMinor, payment.currency)}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{payment.status}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-ink-faint">
                        {payment.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Invoices</h2>
          <div className="overflow-hidden rounded-lg border border-edge">
            {invoices.length === 0 ? (
              <p className="bg-panel p-4 text-sm text-ink-faint">No invoices yet.</p>
            ) : (
              <table className="w-full bg-panel text-sm">
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-edge-soft last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {invoice.number ?? invoice.id.slice(-8)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {formatMinor(
                          invoice.amountPaidMinor || invoice.amountDueMinor,
                          invoice.currency,
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{invoice.status}</td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
