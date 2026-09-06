import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LEARN_ARTICLES } from "@/lib/learn-content";

export const metadata = {
  title: "Learn — servers, hosting and deployment, explained honestly",
  description:
    "Practical guides on hosting costs, VPS management, security and architecture — written to help you decide, not to sell you a server.",
  alternates: { canonical: "/learn" },
};

export default function LearnHubPage() {
  const clusters = [...new Set(LEARN_ARTICLES.map((article) => article.cluster))];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Learn</h1>
        <p className="mt-2 max-w-2xl text-ink-dim">
          Guides on hosting, costs and infrastructure — technically honest, including the cases
          where you do not need a platform like ours.
        </p>

        {clusters.map((cluster) => (
          <section key={cluster} className="mt-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-faint">
              {cluster}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {LEARN_ARTICLES.filter((article) => article.cluster === cluster).map((article) => (
                <Link
                  key={article.slug}
                  href={`/learn/${article.slug}`}
                  className="rounded-xl border border-edge bg-panel p-5 transition-colors hover:border-accent/60"
                >
                  <h3 className="font-medium leading-snug">{article.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{article.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
