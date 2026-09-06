import { prisma } from "@simdeploy/db";
import { formatMinor } from "@simdeploy/finance";
import Link from "next/link";
import { CopyAgentPrompt } from "@/components/copy-agent-prompt";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackPageView } from "@/components/track-page-view";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    number: "01",
    title: "Analyze",
    body: "The AI Project Analyzer scans your project: framework, API routes, database, workers, static share. Deterministic and offline — nothing leaves your machine.",
  },
  {
    number: "02",
    title: "Route",
    body: "The AICloudRouter computes the cost of every compatible architecture from provider price tables and picks the cheapest. You see the estimate before anything ships.",
  },
  {
    number: "03",
    title: "Deploy",
    body: "Build on your machine, upload only the output, publish with a verified health check. A public URL at the end — or a typed error with logs to fix.",
  },
  {
    number: "04",
    title: "Optimize",
    body: "Real measured usage (requests, bandwidth, storage) feeds the Autopilot, which compares allocated versus used and points out where infrastructure can cost less.",
  },
];

/** O mecanismo único, etapa por etapa — a estrutura que a plataforma executa. */
const PIPELINE = [
  { stage: "Your project", detail: "your code, exactly as it is" },
  { stage: "AI Project Analyzer", detail: "deterministic scan of the repository" },
  { stage: "Framework detection", detail: "Next.js, Vite, React, Astro, Express, Node, static" },
  {
    stage: "Requirements detection",
    detail: "API routes, database, cron, workers, storage, env vars",
  },
  {
    stage: "Resource estimation",
    detail: "static share, memory and timeout per architecture",
  },
  {
    stage: "Architecture selection",
    detail: "static, edge, serverless, hybrid or node-server — by compatibility",
  },
  {
    stage: "Cost estimation",
    detail: "monthly projection per provider, free allowances applied",
  },
  { stage: "Build", detail: "on your machine — code never runs on platform servers" },
  { stage: "Deploy", detail: "artifact upload, publish and verified HTTP health check" },
  { stage: "Monitoring", detail: "requests, bandwidth and storage measured per project" },
  { stage: "Optimization", detail: "cost recommendations from real usage" },
];

const FEATURES = [
  {
    title: "Zero infrastructure decisions",
    body: "No choosing CPU, RAM, region, runtime or provider. The platform picks the lowest-cost architecture compatible with your project.",
  },
  {
    title: "Cost before the deploy",
    body: "Every deploy shows the monthly projection per architecture, computed from public price tables — always labeled as an estimate, never a surprise.",
  },
  {
    title: "Built for coding agents",
    body: "Non-interactive CLI (--yes, --json), typed deployment states, structured per-stage logs and a native MCP server for Claude Code, Codex and Cursor.",
  },
  {
    title: "Transparent pipeline",
    body: "Full timeline for every deploy: analysis, queue, build, upload, publish and a real HTTP health check — with an event and log for each transition.",
  },
  {
    title: "Secure by design",
    body: "Your code never runs on the platform's servers: builds happen on your machine and only the output is published, validated before extraction.",
  },
  {
    title: "Predictable pricing",
    body: "Plans with explicit limits, real measured usage (requests and bandwidth) and Stripe billing. What is included is visible before you pay.",
  },
];

const FAQ = [
  {
    q: "What do I need to do to publish a project?",
    a: "Install the CLI, authenticate once and run simdeploy deploy at the project root. Analysis, architecture selection and publishing are automatic.",
  },
  {
    q: "Which frameworks are detected?",
    a: "Next.js, Vite, React (CRA), Astro, Express, generic Node and static sites. Deploys currently cover static builds (Vite, CRA, static Astro, Next with output export); SSR/serverless is rolling out on the cloud adapter — the pipeline fails with a clear message when a project still depends on it.",
  },
  {
    q: "How does it work with Claude Code, Codex or Cursor?",
    a: "The CLI takes --yes and --json for automation, and there is an MCP server with tools for analysis, deploys and log reading. The agent publishes, reads the typed error if something fails and fixes it on its own.",
  },
  {
    q: "How much does it cost?",
    a: "There is a free plan to start. Paid plans have a fixed monthly price with explicit limits — and the infrastructure cost estimate appears before every deploy.",
  },
  {
    q: "How does billing work?",
    a: "Subscription via Stripe (card), with a portal to change plans or cancel at any time. Online purchases carry a 7-day right of withdrawal (article 49 of the Brazilian Consumer Code).",
  },
];

export default async function HomePage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });

  // Dados estruturados (AEO): Organization + Service (categoria nomeada) +
  // SoftwareApplication com featureList + FAQ — o padrão das plataformas de
  // referência, para answer engines extraírem e recomendarem o produto.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "SimDeploy",
        legalName: "Yes Serviços Digitais",
        description:
          "SimDeploy is the AI-native cloud with an infrastructure Autopilot: it analyzes a project, picks the lowest-cost compatible architecture and deploys it in one command — for developers and their coding agents.",
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@simdeploy.com",
          },
        ],
      },
      {
        "@type": "Service",
        serviceType: "AI-native application deployment platform (PaaS)",
        name: "SimDeploy",
        description:
          "SimDeploy analyzes a software project, automatically selects the lowest-cost compatible architecture (static, edge, serverless, hybrid or node-server), deploys it with a verified health check and keeps optimizing infrastructure based on measured usage.",
        provider: { "@type": "Organization", name: "Yes Serviços Digitais" },
      },
      {
        "@type": "SoftwareApplication",
        name: "SimDeploy",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        description:
          "AI-native deploy platform built for developers and coding agents (Claude Code, Codex, Cursor) via dashboard, API, non-interactive CLI and MCP server.",
        featureList: [
          "Automatic project analysis (framework, API routes, database, workers, static share)",
          "Automatic architecture selection by lowest cost (AICloudRouter)",
          "Cost estimate before every deploy, from provider pricing tables",
          "One-command deploys (simdeploy deploy --yes)",
          "Typed deployment pipeline with verified HTTP health check",
          "Structured per-stage deployment logs",
          "Real usage metering (requests, bandwidth, storage)",
          "Encrypted environment variables (AES-256-GCM at rest)",
          "Scoped API tokens",
          "MCP server for coding agents",
          "Client-side builds — user code never runs on platform servers",
          "Stripe subscription billing with customer portal",
        ],
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: `SimDeploy ${plan.name}`,
          price: (plan.priceMonthlyMinor / 100).toFixed(2),
          priceCurrency: plan.currency,
        })),
        publisher: { "@type": "Organization", name: "Yes Serviços Digitais" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
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

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 inline-block rounded-full border border-edge bg-panel px-3 py-1 font-mono text-xs text-ink-dim">
              AI-native deploy platform
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              You build. <span className="text-accent">AI chooses where it runs.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-dim">
              SimDeploy is the cloud with an infrastructure Autopilot: it analyzes your project,
              picks the lowest-cost architecture and ships it in one command — for you and for your
              coding agent.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-md bg-accent px-5 py-2.5 font-medium text-canvas hover:bg-accent-dim"
              >
                Deploy now
              </Link>
              <a
                href="mailto:support@simdeploy.com"
                className="rounded-md border border-edge px-5 py-2.5 text-ink-dim hover:border-accent hover:text-ink"
              >
                Talk to sales
              </a>
            </div>
            <div className="mt-6">
              <p className="mb-2 font-mono text-xs text-ink-faint">
                What you never configure again:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["CPU", "RAM", "Region", "Runtime", "CDN", "SSL", "Sizing", "Price tables"].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-edge bg-panel px-2.5 py-0.5 font-mono text-[11px] text-ink-faint line-through decoration-err/60"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
            <p className="mt-5 font-mono text-xs text-ink-faint">
              Works with Claude Code, Codex, Cursor and your terminal.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-edge bg-panel p-5 font-mono text-sm leading-relaxed text-ink-dim shadow-2xl">
            {`$ npx simdeploy deploy --yes

SimDeploy

OK  Project detected: Vite
OK  128 files analyzed
OK  Architecture calculated

  Recommended: static on cloudflare
  Estimated cost: USD 0.00/month
  (projection from price tables)

Building
OK  Build completed

Deploying
OK  Health check OK (HTTP 200)
OK  Deployment ready

  https://my-project.simdeploy.com`}
          </pre>
        </section>

        {/* O que é (definição citável — answer-first para AEO) */}
        <section className="border-t border-edge-soft">
          <div className="mx-auto w-full max-w-3xl px-6 py-14 text-center">
            <h2 className="text-lg font-medium text-ink-dim">What is SimDeploy?</h2>
            <p className="mt-4 text-xl leading-relaxed">
              SimDeploy is an AI-native deploy platform: it{" "}
              <span className="text-accent">analyzes the project</span>, automatically picks the{" "}
              <span className="text-accent">lowest-cost compatible architecture</span>, deploys it
              with a verified health check and <span className="text-accent">keeps optimizing</span>{" "}
              the infrastructure based on real usage.
            </p>
          </div>
        </section>

        {/* Mecanismo único: Autopilot Infrastructure */}
        <section className="border-t border-edge-soft bg-panel/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold">
              The mechanism: <span className="text-accent">Autopilot Infrastructure</span>
            </h2>
            <p className="mt-2 max-w-2xl text-ink-dim">
              No questions about CPU, RAM, region or runtime. This is the full structure that runs
              on every deploy:
            </p>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
              <ol className="space-y-0">
                {PIPELINE.map((item, index) => (
                  <li key={item.stage} className="relative flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-panel font-mono text-[10px] text-accent">
                        {index + 1}
                      </span>
                      {index < PIPELINE.length - 1 ? (
                        <span className="mt-1 w-px flex-1 bg-edge" />
                      ) : null}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-medium leading-6">{item.stage}</p>
                      <p className="text-xs text-ink-faint">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="grid content-start gap-4 sm:grid-cols-2">
                {STEPS.map((step) => (
                  <div key={step.number} className="rounded-xl border border-edge bg-panel p-6">
                    <p className="font-mono text-xs text-accent">{step.number}</p>
                    <h3 className="mt-2 text-lg font-medium">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-dim">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-edge bg-panel p-6">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agent-first */}
        <section className="border-t border-edge-soft bg-panel/40">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Built for agents to operate alone</h2>
              <p className="mt-3 leading-relaxed text-ink-dim">
                Everything the dashboard does exists as API, CLI and MCP. JSON output, honest exit
                codes, typed failure states and per-stage logs — the agent publishes, diagnoses and
                fixes without human intervention.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs text-ink-dim">
                <span className="rounded-full border border-edge px-3 py-1">Claude Code</span>
                <span className="rounded-full border border-edge px-3 py-1">OpenAI Codex</span>
                <span className="rounded-full border border-edge px-3 py-1">Cursor</span>
                <span className="rounded-full border border-edge px-3 py-1">MCP</span>
              </div>
              <Link
                href="/docs/agents"
                className="mt-6 inline-block rounded-md border border-edge px-4 py-2 text-sm text-ink-dim hover:border-accent hover:text-ink"
              >
                Agent documentation
              </Link>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-edge bg-panel p-5 font-mono text-xs leading-relaxed text-ink-dim">
              {`{
  "mcpServers": {
    "simdeploy": { "command": "simdeploy-mcp" }
  }
}

// tools: analyze_project, estimate_cost,
// deploy_project, get_deployment, get_logs,
// list_projects, get_project, create_project`}
            </pre>
          </div>
        </section>

        {/* Pricing teaser (valores reais do banco) */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Predictable pricing</h2>
              <p className="mt-2 text-ink-dim">
                Explicit limits, measured usage, no surprise bills.
              </p>
            </div>
            <Link href="/pricing" className="text-sm text-accent hover:underline">
              See full plans
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href="/pricing"
                className={`rounded-xl border bg-panel p-5 transition-colors hover:border-accent/60 ${
                  plan.slug === "pro" ? "border-accent" : "border-edge"
                }`}
              >
                <p className="font-medium">{plan.name}</p>
                <p className="mt-1 font-mono text-xl">
                  {plan.priceMonthlyMinor === 0
                    ? "R$ 0"
                    : formatMinor(plan.priceMonthlyMinor, plan.currency)}
                  <span className="text-xs text-ink-faint">/mo</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-edge-soft bg-panel/40">
          <div className="mx-auto w-full max-w-3xl px-6 py-16">
            <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
            <div className="mt-8 space-y-6">
              {FAQ.map((item) => (
                <div key={item.q} className="border-b border-edge-soft pb-6 last:border-0">
                  <h3 className="font-medium">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final — repete o CTA primário do hero + onboard do agente */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold">Built by you, or your agent</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-dim">
            Start free. The cost estimate shows up before any deploy — and your coding agent can
            operate everything on its own.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-accent px-6 py-3 font-medium text-canvas hover:bg-accent-dim"
            >
              Deploy now
            </Link>
            <CopyAgentPrompt />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
