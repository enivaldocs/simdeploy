import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DOC_PAGES, getDocPage } from "@/lib/docs-content";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) return {};
  return {
    title: { absolute: `${page.title} — SimDeploy Docs` },
    description: page.description,
    alternates: { canonical: `/docs/${slug}` },
  };
}

export default async function DocPage({ params }: Params) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-10 px-6 py-12">
        <aside className="hidden w-48 shrink-0 lg:block">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Docs</p>
          <nav className="flex flex-col gap-1.5">
            {DOC_PAGES.map((item) => (
              <Link
                key={item.slug}
                href={`/docs/${item.slug}`}
                className={`text-sm ${
                  item.slug === page.slug ? "text-accent" : "text-ink-dim hover:text-ink"
                }`}
              >
                {item.title.replace(" with SimDeploy", "")}
              </Link>
            ))}
            <Link href="/docs/agents" className="text-sm text-ink-dim hover:text-ink">
              Agent guide
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-3 text-xs text-ink-faint">
            <Link href="/docs" className="hover:text-ink">
              Docs
            </Link>{" "}
            / {page.group}
          </div>
          <h1 className="text-3xl font-semibold leading-tight">{page.title}</h1>
          <p className="mt-3 text-ink-dim">{page.description}</p>

          <article className="mt-10 space-y-10">
            {page.sections.map((section) => (
              <section key={section.h2}>
                <h2 className="text-xl font-medium">{section.h2}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 leading-relaxed text-ink-dim">
                    {paragraph}
                  </p>
                ))}
                {section.code ? (
                  <pre className="mt-4 overflow-x-auto rounded-lg border border-edge bg-panel p-4 font-mono text-sm leading-relaxed text-ink-dim">
                    {section.code}
                  </pre>
                ) : null}
              </section>
            ))}
          </article>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
