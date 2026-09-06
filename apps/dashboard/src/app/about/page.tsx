import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "About",
  description:
    "SimDeploy is the AI-native deploy platform by Yes Servicos Digitais: automatic project analysis, lowest-cost architecture and one-command publishing.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">About SimDeploy</h1>
        <div className="mt-8 space-y-5 leading-relaxed text-ink-dim">
          <p>
            SimDeploy started from a simple observation: code is increasingly written by people with
            the help of AI agents — yet shipping that code still demands infrastructure decisions
            that neither the person nor the agent should have to make. Which runtime, which region,
            how much memory, which provider, and what it will all cost.
          </p>
          <p>
            Our answer is <span className="text-ink">Autopilot Infrastructure</span>: the platform
            analyzes the project, computes the cost of every compatible architecture from provider
            price tables, picks the cheapest one, deploys with a verified health check and keeps
            measuring real usage to recommend optimizations. You (or your agent) run one command and
            get a URL.
          </p>
          <p>
            We are agent-first by principle: everything the dashboard does also exists as an API, a
            non-interactive CLI and an MCP server — because we believe the next deploy of your
            project will quite possibly be done by your agent, not by you.
          </p>
          <p>
            SimDeploy is a product by <span className="text-ink">Yes Servicos Digitais</span>, a
            Brazilian company operating consumer SaaS and digital infrastructure platforms.
          </p>
        </div>
        <div className="mt-10 flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-canvas hover:bg-accent-dim"
          >
            Start free
          </Link>
          <a
            href="mailto:support@simdeploy.com"
            className="rounded-md border border-edge px-5 py-2.5 text-ink-dim hover:border-accent hover:text-ink"
          >
            Contact
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
