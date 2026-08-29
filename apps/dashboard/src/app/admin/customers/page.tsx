import { prisma } from "@autocloud/db";
import { formatMinor } from "@autocloud/finance";
import Link from "next/link";
import { AdminTable } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff("customers");
  const { q } = await searchParams;

  const organizations = await prisma.organization.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { members: { some: { user: { email: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : undefined,
    include: {
      subscription: { include: { plan: true } },
      members: { include: { user: true }, take: 1, orderBy: { createdAt: "asc" } },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const revenue = await prisma.payment.groupBy({
    by: ["organizationId", "currency"],
    where: { status: "SUCCEEDED", organizationId: { in: organizations.map((o) => o.id) } },
    _sum: { amountMinor: true },
  });
  const revenueByOrg = new Map<string, string>();
  for (const row of revenue) {
    const prev = revenueByOrg.get(row.organizationId);
    const formatted = formatMinor(row._sum.amountMinor ?? 0, row.currency);
    revenueByOrg.set(row.organizationId, prev ? `${prev} + ${formatted}` : formatted);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-medium">Customers</h1>
        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="buscar por nome, slug ou e-mail"
            className="w-72 rounded-md border border-edge bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-md border border-edge px-4 py-2 text-sm text-ink-dim hover:text-ink"
          >
            Search
          </button>
        </form>
      </div>

      <AdminTable
        headers={["Customer", "Owner", "Plan", "Status", "Projects", "Revenue (all time)"]}
        empty={organizations.length === 0}
      >
        {organizations.map((org) => (
          <tr key={org.id} className="border-b border-edge-soft last:border-0">
            <td className="px-4 py-2.5">
              <Link href={`/admin/customers/${org.id}`} className="font-medium hover:text-accent">
                {org.name}
              </Link>
              <p className="font-mono text-xs text-ink-faint">{org.slug}</p>
            </td>
            <td className="px-4 py-2.5 text-xs text-ink-dim">
              {org.members[0]?.user.email ?? "—"}
            </td>
            <td className="px-4 py-2.5 text-xs">{org.subscription?.plan.name ?? "—"}</td>
            <td className="px-4 py-2.5 text-xs">{org.subscription?.status ?? "—"}</td>
            <td className="px-4 py-2.5 font-mono text-xs">{org._count.projects}</td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {revenueByOrg.get(org.id) ?? "R$ 0.00"}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
