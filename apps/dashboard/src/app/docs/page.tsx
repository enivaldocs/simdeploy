import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DOC_PAGES } from "@/lib/docs-content";

export const metadata = {
  title: "Documentation",
  description:
    "SimDeploy documentation: CLI, deployments, environment variables, REST API, MCP server, cost engine and plans.",
  alternates: { canonical: "/docs" },
};

export default function DocsHubPage() {
  const groups = [...new Set(DOC_PAGES.map((page) => page.group))];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Documentation</h1>
        <p className="mt-2 max-w-2xl text-ink-dim">
          Everything SimDeploy does, documented — for you and for your coding agent. The
          machine-readable contract lives at{" "}
          <a href="/llms.txt" className="font-mono text-accent hover:underline">
            /llms.txt
          </a>
          .
        </p>

        {groups.map((group) => (
          <section key={group} className="mt-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-faint">
              {group}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {DOC_PAGES.filter((page) => page.group === group).map((page) => (
                <Link
                  key={page.slug}
                  href={`/docs/${page.slug}`}
                  className="rounded-xl border border-edge bg-panel p-5 transition-colors hover:border-accent/60"
                >
                  <h3 className="font-medium leading-snug">{page.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{page.description}</p>
                </Link>
              ))}
              {group === "For agents" ? (
                <Link
                  href="/docs/agents"
                  className="rounded-xl border border-edge bg-panel p-5 transition-colors hover:border-accent/60"
                >
                  <h3 className="font-medium leading-snug">Agent guide</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                    The minimal operating guide for Claude Code, Codex, Cursor and other coding
                    agents.
                  </p>
                </Link>
              ) : null}
            </div>
          </section>
        ))}

        <p className="mt-10 border-t border-edge-soft pt-6 text-sm text-ink-dim">
          New to hosting concepts? The{" "}
          <Link href="/learn" className="text-accent hover:underline">
            Learn hub
          </Link>{" "}
          explains cost models, VPS management and security in plain terms.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
