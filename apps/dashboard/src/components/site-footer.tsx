import Link from "next/link";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/ai-deployment-platform", label: "For AI-built software" },
      { href: "/cheap-nextjs-hosting", label: "Next.js hosting" },
      { href: "/docs", label: "Docs" },
      { href: "/learn", label: "Learn" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "For agents",
    links: [
      { href: "/docs/agents", label: "Agent docs" },
      { href: "/claude-code-deploy", label: "Claude Code" },
      { href: "/codex-deploy", label: "Codex" },
      { href: "/cursor-deploy", label: "Cursor" },
      { href: "/llms.txt", label: "llms.txt" },
    ],
  },
  {
    title: "Compare",
    links: [
      { href: "/vercel-alternative", label: "AutoCloud vs deploy platforms" },
      { href: "/cheap-nextjs-hosting", label: "Lowest-cost Next.js hosting" },
      { href: "/ai-deployment-platform", label: "Why agent-first" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/security", label: "Security" },
      { href: "mailto:support@autocloud.app", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/acceptable-use", label: "Acceptable Use" },
      { href: "/dpa", label: "DPA" },
    ],
  },
];

/** Footer institucional compartilhado das páginas públicas. */
export function SiteFooter() {
  return (
    <footer className="border-t border-edge-soft">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <p className="font-mono text-lg font-semibold">
            auto<span className="text-accent">cloud</span>
          </p>
          <p className="mt-2 max-w-[22ch] text-sm leading-relaxed text-ink-faint">
            You build. AI chooses where it runs.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
              {column.title}
            </p>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-dim hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-edge-soft">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-ink-faint">
          <p>AutoCloud — a Yes Servicos Digitais product. All rights reserved.</p>
          <p className="font-mono">npx autocloud deploy</p>
        </div>
      </div>
    </footer>
  );
}
