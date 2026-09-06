import { prisma } from "@simdeploy/db";
import { formatMinor } from "@simdeploy/finance";
import { AdminTable } from "@/components/admin-ui";
import { getFeatureFlags, getFxRateUsdBrl } from "@/lib/admin/config";
import { requireStaff } from "@/lib/auth/staff";
import { FeatureFlagsForm, FxRateForm, PlanEditForm } from "./settings-forms";

export default async function AdminSettingsPage() {
  await requireStaff("settings");
  const [fxRate, flags, plans] = await Promise.all([
    getFxRateUsdBrl(),
    getFeatureFlags(),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-xl font-medium">Settings</h1>

      <section className="mb-10 rounded-lg border border-edge bg-panel p-5">
        <h2 className="mb-1 text-sm font-medium">FX rate USD → BRL</h2>
        <p className="mb-4 text-xs text-ink-faint">
          Usada para converter custos de provider (USD) em margens (BRL). Sem taxa, margens
          multi-moeda mostram "Configure FX rate" — nunca um número com taxa inventada.
          {fxRate ? ` Taxa atual: ${fxRate}.` : " Nenhuma taxa configurada."}
        </p>
        <FxRateForm currentRate={fxRate} />
      </section>

      <section className="mb-10 rounded-lg border border-edge bg-panel p-5">
        <h2 className="mb-1 text-sm font-medium">Feature flags</h2>
        <p className="mb-4 text-xs text-ink-faint">
          Globais aqui; liberação por plano/organização via API de config.
        </p>
        <FeatureFlagsForm flags={flags} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-ink-dim">Plans (config no banco)</h2>
        <AdminTable headers={["Plan", "Monthly price", "Annual", "Limits", "Edit monthly"]}>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b border-edge-soft last:border-0">
              <td className="px-4 py-2.5">
                {plan.name}
                <p className="font-mono text-xs text-ink-faint">
                  {plan.slug}
                  {plan.active ? "" : " (inactive)"}
                </p>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {formatMinor(plan.priceMonthlyMinor, plan.currency)}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {plan.priceAnnualMinor ? formatMinor(plan.priceAnnualMinor, plan.currency) : "—"}
              </td>
              <td className="max-w-xs px-4 py-2.5 font-mono text-[10px] text-ink-faint">
                {JSON.stringify(plan.limits)}
              </td>
              <td className="px-4 py-2.5">
                <PlanEditForm
                  plan={{
                    id: plan.id,
                    slug: plan.slug,
                    priceMonthlyMinor: plan.priceMonthlyMinor,
                    priceAnnualMinor: plan.priceAnnualMinor,
                  }}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
        <p className="mt-2 text-xs text-ink-faint">
          Alterar o preço invalida o price antigo no Stripe — o próximo checkout auto-provisiona um
          novo. Assinaturas existentes seguem no preço contratado até mudança via portal.
        </p>
      </section>
    </div>
  );
}
