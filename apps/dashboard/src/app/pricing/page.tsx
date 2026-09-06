import { prisma } from "@simdeploy/db";
import { formatMinor } from "@simdeploy/finance";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { trackEvent } from "@/lib/analytics";

export const metadata = {
  title: "Pricing",
  description:
    "Predictable cloud pricing. Free to start, plans that scale with your projects — no surprise bills.",
};

interface PlanLimits {
  maxProjects?: number;
  maxDeploymentsPerDay?: number;
  customDomains?: boolean;
  bandwidthGb?: number;
  buildMinutes?: number;
  storageGb?: number;
}

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  await trackEvent({ name: "plan_viewed", properties: { page: "/pricing" } });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-3xl font-semibold">Predictable cloud pricing</h1>
        <p className="mb-10 max-w-2xl text-ink-dim">
          What is included, the limits and the overage — always visible before you are charged. The
          cost estimate appears before every deploy.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const limits = plan.limits as PlanLimits;
            const highlight = plan.slug === "pro";
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-xl border bg-panel p-6 ${
                  highlight ? "border-accent" : "border-edge"
                }`}
              >
                <h2 className="font-medium">{plan.name}</h2>
                <p className="mt-2 font-mono text-2xl">
                  {plan.priceMonthlyMinor === 0
                    ? "R$ 0"
                    : formatMinor(plan.priceMonthlyMinor, plan.currency)}
                  <span className="text-sm text-ink-faint">/mo</span>
                </p>
                {plan.priceAnnualMinor ? (
                  <p className="text-xs text-ink-faint">
                    or {formatMinor(plan.priceAnnualMinor, plan.currency)}/yr
                  </p>
                ) : null}
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-dim">
                  <li>{limits.maxProjects ?? "—"} projects</li>
                  <li>{limits.maxDeploymentsPerDay ?? "—"} deploys/day</li>
                  <li>{limits.bandwidthGb ?? "—"} GB bandwidth/mo</li>
                  <li>{limits.storageGb ?? "—"} GB storage</li>
                  <li>{limits.customDomains ? "Custom domains" : "simdeploy subdomain"}</li>
                </ul>
                <Link
                  href={plan.priceMonthlyMinor === 0 ? "/login" : "/dashboard/billing"}
                  className={`mt-5 rounded-md px-4 py-2 text-center text-sm font-medium ${
                    highlight
                      ? "bg-accent text-canvas hover:bg-accent-dim"
                      : "border border-edge text-ink-dim hover:border-accent hover:text-ink"
                  }`}
                >
                  {plan.priceMonthlyMinor === 0 ? "Start free" : `Get ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-ink-faint">
          Infrastructure figures shown in the product are projections from public provider price
          tables — the real bill comes exclusively from billing. Cancel anytime through the portal;
          7-day right of withdrawal (article 49 of the Brazilian Consumer Code).
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
