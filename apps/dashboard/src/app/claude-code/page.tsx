import type { Metadata } from "next";
import Link from "next/link";
import { CopyAgentPrompt } from "@/components/copy-agent-prompt";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackPageView } from "@/components/track-page-view";

export const metadata: Metadata = {
  title: { absolute: "Deploy with Claude Code — SimDeploy" },
  description:
    "SimDeploy is the deploy platform optimized for Claude Code: one command to analyze, deploy and debug any project, with a native MCP server and typed states Claude can act on.",
  alternates: { canonical: "/claude-code" },
};

const STEPS = [
  {
    n: "1",
    title: "Set up the project",
    body: "simdeploy setup writes .mcp.json (Claude Code), .cursor/mcp.json and an AGENTS.md deploy section. Claude Code now has the tools to analyze and deploy — no further config.",
    code: "npx simdeploy setup",
  },
  {
    n: "2",
    title: "Authenticate once",
    body: "A human creates a token in the dashboard and Claude logs in. The token is scoped and revocable.",
    code: "simdeploy login --token sd_live_...",
  },
  {
    n: "3",
    title: "Ask Claude to deploy",
    body: "Claude runs the deploy, reads the public URL, and if anything fails it reads the typed error and per-stage logs and fixes it — on its own.",
    code: "simdeploy deploy --yes",
  },
];

const WHY = [
  {
    title: "Native MCP server",
    body: "analyze_project, deploy_project, get_logs, estimate_cost and more — Claude calls them directly. Analysis runs offline; nothing leaves the machine until you deploy.",
  },
  {
    title: "Typed states Claude can branch on",
    body: "READY, BUILD_FAILED, DEPLOY_FAILED, ANALYSIS_FAILED — with a documented next step for each. Exit codes are non-zero on failure, so the agent knows when to fix.",
  },
  {
    title: "One command, zero decisions",
    body: "No CPU, RAM, region, runtime or provider. SimDeploy analyzes the project and picks the lowest-cost compatible architecture, showing the estimate first.",
  },
  {
    title: "The repo teaches the next agent",
    body: "The first deploy writes AGENTS.md into the project. Any agent that opens the repo afterwards knows to deploy here — the workflow travels with the code.",
  },
];

export default function ClaudeCodePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Deploy a project with Claude Code using SimDeploy",
    description:
      "How a coding agent (Claude Code) deploys any web project with SimDeploy in one command.",
    step: STEPS.map((s) => ({ "@type": "HowToStep", name: s.title, text: s.body })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático gerado no servidor
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackPageView event="landing_view" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <p className="mb-4 inline-block rounded-full border border-edge bg-panel px-3 py-1 font-mono text-xs text-ink-dim">
          Optimized for Claude Code
        </p>
        <h1 className="text-4xl font-semibold leading-tight">Deploy with Claude Code</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-dim">
          SimDeploy is the deploy platform built to be operated by Claude Code. Ask Claude to ship
          your project — it analyzes the code, picks the lowest-cost architecture, deploys it and
          hands back a public URL. If a deploy fails, Claude reads the typed error and fixes it.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-canvas hover:bg-accent-dim"
          >
            Get a token
          </Link>
          <CopyAgentPrompt />
        </div>

        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-semibold">Three steps</h2>
          <div className="space-y-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-edge bg-panel p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-accent">{s.n}</span>
                  <h3 className="text-lg font-medium">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{s.body}</p>
                <pre className="mt-3 overflow-x-auto rounded-md border border-edge bg-panel-2 p-3 font-mono text-sm text-ink-dim">
                  {s.code}
                </pre>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-semibold">Why it works with Claude</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-xl border border-edge bg-panel p-5">
                <h3 className="font-medium">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-4 text-2xl font-semibold">Add the MCP server</h2>
          <p className="mb-4 text-sm leading-relaxed text-ink-dim">
            `simdeploy setup` does this for you. To do it by hand, add this to your project's{" "}
            <span className="font-mono text-ink">.mcp.json</span>:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-edge bg-panel p-4 font-mono text-sm text-ink-dim">
            {`{
  "mcpServers": {
    "simdeploy": { "command": "simdeploy-mcp" }
  }
}`}
          </pre>
          <p className="mt-4 text-sm text-ink-dim">
            The machine-readable contract lives at{" "}
            <a href="/llms.txt" className="text-accent hover:underline">
              /llms.txt
            </a>{" "}
            and the full agent guide at{" "}
            <Link href="/docs/agents" className="text-accent hover:underline">
              /docs/agents
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
