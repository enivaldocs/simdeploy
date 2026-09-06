import { prisma } from "@simdeploy/db";
import { AdminTable } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";
import { providerRegistry } from "@/lib/services/providers";

export default async function AdminProvidersPage() {
  await requireStaff("providers");
  const providers = await prisma.provider.findMany({
    include: { pricing: true },
    orderBy: { slug: "asc" },
  });
  const registry = providerRegistry();

  const health = await Promise.all(
    registry.list().map(async (provider) => ({
      slug: provider.slug,
      health: await provider.healthCheck(),
    })),
  );
  const healthMap = new Map(health.map((h) => [h.slug, h.health]));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-xl font-medium">Providers</h1>
      <div className="mb-8">
        <AdminTable headers={["Provider", "Deploy adapter", "Health", "Pricing items"]}>
          {providers.map((provider) => {
            const hasAdapter = registry.has(provider.slug);
            const providerHealth = healthMap.get(provider.slug);
            return (
              <tr key={provider.id} className="border-b border-edge-soft last:border-0">
                <td className="px-4 py-2.5">
                  {provider.name}
                  <p className="font-mono text-xs text-ink-faint">{provider.slug}</p>
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {hasAdapter ? (
                    <span className="text-ok">registered</span>
                  ) : (
                    <span className="text-ink-faint">
                      {provider.active ? "pricing only" : "reference only"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {providerHealth ? (
                    providerHealth.healthy ? (
                      <span className="text-ok">Operational</span>
                    ) : (
                      <span className="text-err">{providerHealth.message ?? "Down"}</span>
                    )
                  ) : (
                    <span className="text-ink-faint">not checked</span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{provider.pricing.length}</td>
              </tr>
            );
          })}
        </AdminTable>
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Pricing tables (config no banco)</h2>
      <AdminTable headers={["Provider", "Resource", "Price/unit", "Free allowance", "Snapshot"]}>
        {providers.flatMap((provider) =>
          provider.pricing.map((row) => (
            <tr key={row.id} className="border-b border-edge-soft last:border-0">
              <td className="px-4 py-2.5 font-mono text-xs">{provider.slug}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{row.resource}</td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {row.currency} {Number(row.pricePerUnit).toFixed(10).replace(/0+$/, "0")} /{" "}
                {row.unit}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">{Number(row.freeAllowance)}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">
                {row.effectiveAt.toISOString().slice(0, 10)}
              </td>
            </tr>
          )),
        )}
      </AdminTable>
    </div>
  );
}
