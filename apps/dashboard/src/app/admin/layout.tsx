import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isStaff, type StaffArea, staffCanAccess } from "@/lib/auth/staff";

const NAV: Array<{ href: string; label: string; area: StaffArea }> = [
  { href: "/admin", label: "Overview", area: "overview" },
  { href: "/admin/customers", label: "Customers", area: "customers" },
  { href: "/admin/projects", label: "Projects", area: "projects" },
  { href: "/admin/deployments", label: "Deployments", area: "deployments" },
  { href: "/admin/subscriptions", label: "Subscriptions", area: "subscriptions" },
  { href: "/admin/finance", label: "Finance", area: "finance" },
  { href: "/admin/finance/unit-economics", label: "Unit economics", area: "finance" },
  { href: "/admin/growth", label: "Growth", area: "growth" },
  { href: "/admin/usage", label: "Usage", area: "usage" },
  { href: "/admin/providers", label: "Providers", area: "providers" },
  { href: "/admin/webhooks", label: "Webhooks", area: "webhooks" },
  { href: "/admin/system", label: "System", area: "system" },
  { href: "/admin/settings", label: "Settings", area: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isStaff(session.user.staffRole)) redirect("/login");
  const role = session.user.staffRole;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-edge-soft bg-panel px-4 py-6">
        <Link href="/admin" className="mb-1 px-2 font-mono text-lg font-semibold">
          auto<span className="text-accent">cloud</span>
        </Link>
        <p className="mb-6 px-2 font-mono text-[10px] uppercase tracking-wider text-warn">
          admin · {role.toLowerCase()}
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV.filter((item) => staffCanAccess(role, item.area)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-ink-dim hover:bg-panel-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-edge-soft pt-4">
          <p className="truncate px-2 pb-2 text-xs text-ink-faint">{session.user.email}</p>
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-1.5 text-sm text-ink-dim hover:bg-panel-2 hover:text-ink"
          >
            Customer dashboard
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
