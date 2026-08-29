import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackPageView } from "@/components/track-page-view";
import { LANDING_PAGES } from "@/lib/landings";

type Params = { params: Promise<{ landing: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LANDING_PAGES).map((landing) => ({ landing }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { landing } = await params;
  const content = LANDING_PAGES[landing];
  if (!content) return {};
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: `/${landing}` },
  };
}

export default async function LandingPage({ params }: Params) {
  const { landing } = await params;
  const content = LANDING_PAGES[landing];
  if (!content) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <TrackPageView event="landing_view" />

        <h1 className="mb-4 text-3xl font-semibold leading-tight">{content.h1}</h1>
        <p className="mb-8 leading-relaxed text-ink-dim">{content.intro}</p>

        <h2 className="mb-3 text-lg font-medium">Como funciona</h2>
        <pre className="mb-8 overflow-x-auto rounded-lg border border-edge bg-panel p-5 font-mono text-sm leading-relaxed text-ink-dim">
          {content.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
        </pre>

        <ul className="mb-10 space-y-2">
          {content.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-sm text-ink-dim">
              <span className="text-accent">—</span>
              {bullet}
            </li>
          ))}
        </ul>

        <div className="flex gap-4">
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
            Agent docs
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
