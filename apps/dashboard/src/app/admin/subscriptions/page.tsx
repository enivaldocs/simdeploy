import { prisma } from "@simdeploy/db";
import { formatMinor } from "@simdeploy/finance";
import Link from "next/link";
import { AdminTable } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminSubscriptionsPage() {
  await requireStaff("subscriptions");
  const subscriptions = await prisma.subscription.findMany({
    include: { organization: true, plan: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-xl font-medium">Subscriptions</h1>
      <AdminTable
        headers={["Customer", "Plan", "Price", "Status", "Period end", "Stripe"]}
        empty={subscriptions.length === 0}
      >
        {subscriptions.map((sub) => (
          <tr key={sub.id} className="border-b border-edge-soft last:border-0">
            <td className="px-4 py-2.5">
              <Link href={`/admin/customers/${sub.organizationId}`} className="hover:text-accent">
                {sub.organization.name}
              </Link>
            </td>
            <td className="px-4 py-2.5 text-xs">{sub.plan.name}</td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {sub.plan.priceMonthlyMinor === 0
                ? "free"
                : `${formatMinor(sub.plan.priceMonthlyMinor, sub.plan.currency)}/mo`}
            </td>
            <td className="px-4 py-2.5 text-xs">
              {sub.status}
              {sub.cancelAtPeriodEnd ? " (canceling)" : ""}
            </td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {sub.currentPeriodEnd?.toISOString().slice(0, 10) ?? "—"}
            </td>
            <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">
              {sub.stripeSubscriptionId ?? "—"}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
