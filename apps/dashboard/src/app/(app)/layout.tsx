import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-edge-soft bg-panel px-4 py-6">
        <Link href="/dashboard" className="mb-8 px-2 font-mono text-lg font-semibold">
          auto<span className="text-accent">cloud</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-ink-dim hover:bg-panel-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-edge-soft pt-4">
          <p className="truncate px-2 text-xs text-ink-faint">{session.user.email}</p>
          <p className="truncate px-2 pb-3 text-xs text-ink-faint">
            org: {session.organization.slug}
          </p>
          <form method="post" action="/api/auth/logout">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-dim hover:bg-panel-2 hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
