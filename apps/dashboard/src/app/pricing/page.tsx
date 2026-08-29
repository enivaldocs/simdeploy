import { prisma } from "@autocloud/db";
import { formatMinor } from "@autocloud/finance";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export const metadata = {
  title: "Pricing — AutoCloud",
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
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="font-mono text-lg font-semibold">
          auto<span className="text-accent">cloud</span>
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-dim hover:text-ink"
        >
          Sign in
        </Link>
      </header>
      <h1 className="mb-2 text-3xl font-semibold">Predictable cloud pricing</h1>
      <p className="mb-10 max-w-2xl text-ink-dim">
        O que está incluso, os limites e o excedente — sempre visíveis antes da cobrança. A
        estimativa de custo aparece antes de cada deploy.
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
                <span className="text-sm text-ink-faint">/mês</span>
              </p>
              {plan.priceAnnualMinor ? (
                <p className="text-xs text-ink-faint">
                  ou {formatMinor(plan.priceAnnualMinor, plan.currency)}/ano
                </p>
              ) : null}
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-dim">
                <li>{limits.maxProjects ?? "—"} projetos</li>
                <li>{limits.maxDeploymentsPerDay ?? "—"} deploys/dia</li>
                <li>{limits.bandwidthGb ?? "—"} GB de banda/mês</li>
                <li>{limits.storageGb ?? "—"} GB de storage</li>
                <li>{limits.customDomains ? "Domínios personalizados" : "Subdomínio autocloud"}</li>
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
        Valores de infraestrutura exibidos no produto são projeções baseadas em tabelas públicas de
        preço dos providers — a fatura real vem exclusivamente do billing.
      </p>
    </main>
  );
}
