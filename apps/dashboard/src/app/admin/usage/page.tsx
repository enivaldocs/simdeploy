import { prisma } from "@autocloud/db";
import Link from "next/link";
import { AdminTable } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminUsagePage() {
  await requireStaff("usage");
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const grouped = await prisma.usageMetric.groupBy({
    by: ["projectId", "metric"],
    where: { periodStart: { gte: since30d } },
    _sum: { value: true },
  });
  const projects = await prisma.project.findMany({
    where: { id: { in: [...new Set(grouped.map((g) => g.projectId))] } },
    include: { organization: true },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const byProject = new Map<string, Record<string, number>>();
  for (const row of grouped) {
    const metrics = byProject.get(row.projectId) ?? {};
    metrics[row.metric] = Number(row._sum.value ?? 0);
    byProject.set(row.projectId, metrics);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-2 text-xl font-medium">Usage (30d)</h1>
      <p className="mb-8 text-xs text-ink-faint">
        Uso medido pelo serving e pelo pipeline — dados reais por projeto.
      </p>
      <AdminTable
        headers={["Project", "Customer", "Requests", "Bandwidth", "Deployments"]}
        empty={byProject.size === 0}
      >
        {[...byProject.entries()].map(([projectId, metrics]) => {
          const project = projectMap.get(projectId);
          if (!project) return null;
          return (
            <tr key={projectId} className="border-b border-edge-soft last:border-0">
              <td className="px-4 py-2.5">{project.name}</td>
              <td className="px-4 py-2.5 text-xs">
                <Link
                  href={`/admin/customers/${project.organizationId}`}
                  className="hover:text-accent"
                >
                  {project.organization.name}
                </Link>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">{metrics.requests ?? 0}</td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {formatBytes(metrics.bandwidth_bytes ?? 0)}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">{metrics.deployments ?? 0}</td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
