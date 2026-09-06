import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Changelog",
  description: "What shipped on AutoCloud — real releases, dated.",
  alternates: { canonical: "/changelog" },
};

/** Entradas refletem entregas REAIS do produto (histórico do repositório). */
const ENTRIES: Array<{ date: string; title: string; items: string[] }> = [
  {
    date: "2026-08-29",
    title: "Learn hub and public docs",
    items: [
      "Public documentation: getting started, CLI, deployments, environment variables, REST API, MCP server, cost engine, plans.",
      "Learn hub with technically honest guides on hosting costs, VPS management, hardening and backups.",
      "Public changelog and security pages.",
    ],
  },
  {
    date: "2026-08-29",
    title: "Billing goes live",
    items: [
      "Stripe subscriptions: checkout, customer portal, signed webhooks with dedup and retry, invoice/payment mirroring.",
      "Credit wallet as an immutable ledger (balance always derived).",
      "Reconciliation job that discovers and syncs subscriptions even if a webhook is missed.",
    ],
  },
  {
    date: "2026-08-29",
    title: "Operational layer: admin, finance, usage",
    items: [
      "Admin with role-based access: business overview, Customer 360, finance with per-customer P&L, unit economics, growth funnel, system health.",
      "Real usage metering: requests, bandwidth, storage and deploys measured per project.",
      "Deployment pipeline gained UPLOADING and HEALTH_CHECK stages — every deploy is verified with a real HTTP check before READY.",
      "In-app notifications: welcome, first deploy, deploy failed, payment failed/recovered, usage at 80%/100%.",
    ],
  },
  {
    date: "2026-08-29",
    title: "AutoCloud foundation",
    items: [
      "Autopilot Infrastructure: deterministic project analyzer, cost engine over provider price tables, lowest-cost architecture router.",
      "One-command deploys: autocloud deploy --yes with client-side builds and typed pipeline states.",
      "Dashboard, REST API v1 with scoped tokens, non-interactive CLI and MCP server for coding agents.",
      "Encrypted environment variables, per-organization isolation, audit log.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Changelog</h1>
        <p className="mt-2 text-ink-dim">What shipped, when — no vaporware.</p>
        <div className="mt-10 space-y-12">
          {ENTRIES.map((entry) => (
            <section key={entry.title} className="relative border-l border-edge pl-6">
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
              <p className="font-mono text-xs text-ink-faint">{entry.date}</p>
              <h2 className="mt-1 text-xl font-medium">{entry.title}</h2>
              <ul className="mt-3 space-y-2">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink-dim">
                    <span className="text-accent">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
