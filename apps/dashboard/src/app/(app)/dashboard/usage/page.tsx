import { prisma } from "@autocloud/db";
import { getSession } from "@/lib/auth/session";
import { usageCollector } from "@/lib/usage-collector";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Uso REAL medido (serving + deployments) dos últimos 30 dias. */
export default async function UsagePage() {
  const session = await getSession();
  if (!session) return null;

  // Garante que contadores em memória recentes apareçam na tela.
  await usageCollector().flush();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const projects = await prisma.project.findMany({
    where: { organizationId: session.organization.id },
    select: { id: true, name: true, slug: true },
  });
  const grouped = await prisma.usageMetric.groupBy({
    by: ["projectId", "metric"],
    where: { projectId: { in: projects.map((p) => p.id) }, periodStart: { gte: since } },
    _sum: { value: true },
  });

  const byProject = new Map<string, Record<string, number>>();
  for (const row of grouped) {
    const metrics = byProject.get(row.projectId) ?? {};
    metrics[row.metric] = Number(row._sum.value ?? 0);
    byProject.set(row.projectId, metrics);
  }

  const totals: Record<string, number> = {};
  for (const metrics of byProject.values()) {
    for (const [metric, value] of Object.entries(metrics)) {
      totals[metric] = (totals[metric] ?? 0) + value;
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-xl font-medium">Usage</h1>
      <p className="mb-8 text-sm text-ink-dim">
        Uso medido nos últimos 30 dias (tráfego servido e deployments — dados reais, não
        estimativas).
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-edge bg-panel p-4">
          <p className="text-xs text-ink-faint">Requests</p>
          <p className="mt-1 font-mono text-xl">{totals.requests ?? 0}</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-4">
          <p className="text-xs text-ink-faint">Bandwidth</p>
          <p className="mt-1 font-mono text-xl">{formatBytes(totals.bandwidth_bytes ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-4">
          <p className="text-xs text-ink-faint">Deployments</p>
          <p className="mt-1 font-mono text-xl">{totals.deployments ?? 0}</p>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-4">
          <p className="text-xs text-ink-faint">Storage (último artefato)</p>
          <p className="mt-1 font-mono text-xl">{formatBytes(totals.storage_bytes ?? 0)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink-dim">Per project</h2>
      <div className="overflow-hidden rounded-lg border border-edge">
        {projects.length === 0 ? (
          <p className="bg-panel p-5 text-sm text-ink-faint">No projects.</p>
        ) : (
          <table className="w-full bg-panel text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs text-ink-faint">
                <th className="px-4 py-2.5 font-normal">Project</th>
                <th className="px-4 py-2.5 font-normal">Requests</th>
                <th className="px-4 py-2.5 font-normal">Bandwidth</th>
                <th className="px-4 py-2.5 font-normal">Deployments</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const metrics = byProject.get(project.id) ?? {};
                return (
                  <tr key={project.id} className="border-b border-edge-soft last:border-0">
                    <td className="px-4 py-2.5">{project.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{metrics.requests ?? 0}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {formatBytes(metrics.bandwidth_bytes ?? 0)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{metrics.deployments ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
