import { prisma } from "@autocloud/db";
import Link from "next/link";
import { AdminTable } from "@/components/admin-ui";
import { StatusBadge } from "@/components/status-badge";
import { requireStaff } from "@/lib/auth/staff";
import { timeAgo } from "@/lib/format";

export default async function AdminProjectsPage() {
  await requireStaff("projects");
  const projects = await prisma.project.findMany({
    include: {
      organization: true,
      deployments: { take: 1, orderBy: { createdAt: "desc" } },
      costEstimates: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-xl font-medium">Projects</h1>
      <AdminTable
        headers={["Project", "Customer", "Framework", "Last deploy", "Est. cost/mo", "Created"]}
        empty={projects.length === 0}
      >
        {projects.map((project) => (
          <tr key={project.id} className="border-b border-edge-soft last:border-0">
            <td className="px-4 py-2.5">
              {project.name}
              <p className="font-mono text-xs text-ink-faint">{project.slug}</p>
            </td>
            <td className="px-4 py-2.5 text-xs">
              <Link
                href={`/admin/customers/${project.organizationId}`}
                className="hover:text-accent"
              >
                {project.organization.name}
              </Link>
            </td>
            <td className="px-4 py-2.5 font-mono text-xs">{project.framework ?? "—"}</td>
            <td className="px-4 py-2.5">
              {project.deployments[0] ? (
                <StatusBadge status={project.deployments[0].status} />
              ) : (
                <span className="text-xs text-ink-faint">—</span>
              )}
            </td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {project.costEstimates[0]
                ? `USD ${Number(project.costEstimates[0].monthlyUsd).toFixed(2)} (est.)`
                : "—"}
            </td>
            <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(project.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
