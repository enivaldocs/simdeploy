import { prisma } from "@simdeploy/db";
import { computeFunnel } from "@simdeploy/finance";
import { AdminTable, Stat } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";

const FUNNEL_STEPS = [
  "landing_view",
  "signup_started",
  "signup_completed",
  "project_created",
  "deployment_started",
  "deployment_completed",
  "billing_viewed",
  "checkout_started",
  "subscription_started",
] as const;

export default async function AdminGrowthPage() {
  await requireStaff("growth");
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const counts = await prisma.analyticsEvent.groupBy({
    by: ["name"],
    where: { createdAt: { gte: since30d } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.name, c._count._all]));
  const funnel = computeFunnel(
    FUNNEL_STEPS.map((name) => ({ name, count: countMap.get(name) ?? 0 })),
  );

  const acquisitions = await prisma.acquisition.groupBy({
    by: ["utmSource"],
    _count: { _all: true },
  });

  const signups30d = countMap.get("signup_completed") ?? 0;
  const deploys30d = countMap.get("deployment_completed") ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-xl font-medium">Growth</h1>
      <p className="mb-8 text-xs text-ink-faint">Eventos reais dos últimos 30 dias.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Landing views (30d)" value={String(countMap.get("landing_view") ?? 0)} />
        <Stat label="Signups (30d)" value={String(signups30d)} />
        <Stat label="Deploys completed (30d)" value={String(deploys30d)} />
        <Stat
          label="Checkouts started (30d)"
          value={String(countMap.get("checkout_started") ?? 0)}
        />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Conversion funnel (30d)</h2>
      <div className="mb-10">
        <AdminTable headers={["Step", "Count", "Step conversion", "From top"]}>
          {funnel.map((step) => (
            <tr key={step.name} className="border-b border-edge-soft last:border-0">
              <td className="px-4 py-2.5 font-mono text-xs">{step.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{step.count}</td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {step.stepConversionPct === null ? "—" : `${step.stepConversionPct}%`}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {step.topConversionPct === null ? "—" : `${step.topConversionPct}%`}
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Signups by source (first touch)</h2>
      <AdminTable headers={["Source", "Signups"]} empty={acquisitions.length === 0}>
        {acquisitions
          .sort((a, b) => b._count._all - a._count._all)
          .map((row) => (
            <tr key={row.utmSource ?? "direct"} className="border-b border-edge-soft last:border-0">
              <td className="px-4 py-2.5 font-mono text-xs">
                {row.utmSource ?? "(direct/unknown)"}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">{row._count._all}</td>
            </tr>
          ))}
      </AdminTable>
    </div>
  );
}
