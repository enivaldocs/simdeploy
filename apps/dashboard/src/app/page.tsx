import Link from "next/link";

const BENEFITS = [
  {
    title: "AI Infrastructure Autopilot",
    body: "AutoCloud analyzes your project, picks the architecture and keeps optimizing it as usage changes.",
  },
  {
    title: "Lowest-cost architecture",
    body: "Every deployment is routed to the cheapest compatible infrastructure, with the estimate shown before you ship.",
  },
  {
    title: "One-command deployments",
    body: "autocloud deploy. That is the whole workflow — no CPU, RAM, region or runtime decisions.",
  },
  {
    title: "Built for coding agents",
    body: "Non-interactive CLI, structured logs and a first-class API. Claude Code, Codex and Cursor can operate it end to end.",
  },
  {
    title: "Predictable pricing",
    body: "Cost estimates come from provider pricing tables, labeled as projections — never surprises.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-8">
        <span className="font-mono text-lg font-semibold tracking-tight text-ink">
          auto<span className="text-accent">cloud</span>
        </span>
        <nav className="flex items-center gap-6 text-sm text-ink-dim">
          <Link href="/docs/agents" className="hover:text-ink">
            Docs
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-edge px-3 py-1.5 hover:border-accent hover:text-ink"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="flex flex-col items-start gap-6 py-24">
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
          You build. <span className="text-accent">AI chooses where it runs.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-ink-dim">
          Deploy your AI-built projects without choosing servers, CPU or infrastructure. AutoCloud
          automatically finds the lowest-cost architecture for your application.
        </p>
        <div className="flex gap-4 pt-2">
          <Link
            href="/login"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-canvas hover:bg-accent-dim"
          >
            Deploy your first project
          </Link>
          <Link
            href="/docs/agents"
            className="rounded-md border border-edge px-5 py-2.5 text-ink-dim hover:border-accent hover:text-ink"
          >
            Analyze my project
          </Link>
        </div>
        <pre className="mt-8 w-full max-w-2xl overflow-x-auto rounded-lg border border-edge bg-panel p-5 font-mono text-sm leading-relaxed text-ink-dim">
          {`$ npx autocloud deploy

AutoCloud

  Project detected: Vite
  128 files analyzed
  Architecture calculated

  Recommended: Edge Static Assets
  Estimated cost: USD 0.00/month (projection)

  Building
  Deploying

Deployment ready:
https://my-project.autocloud.app`}
        </pre>
      </section>

      <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="rounded-lg border border-edge bg-panel p-5">
            <h2 className="mb-2 font-medium text-ink">{benefit.title}</h2>
            <p className="text-sm leading-relaxed text-ink-dim">{benefit.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-edge-soft py-8 text-sm text-ink-faint">
        AutoCloud — AI-native cloud platform
      </footer>
    </main>
  );
}
