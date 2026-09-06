import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLearnArticle, LEARN_ARTICLES } from "@/lib/learn-content";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LEARN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/learn/${slug}` },
  };
}

export default async function LearnArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        dateModified: article.updated,
        author: { "@type": "Organization", name: "SimDeploy" },
        publisher: { "@type": "Organization", name: "Yes Servicos Digitais" },
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  const related = LEARN_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático gerado no servidor
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="mb-3 text-xs text-ink-faint">
          <Link href="/learn" className="hover:text-ink">
            Learn
          </Link>{" "}
          / {article.cluster}
        </div>
        <h1 className="text-3xl font-semibold leading-tight">{article.title}</h1>
        <p className="mt-3 text-ink-dim">{article.description}</p>
        <p className="mt-2 font-mono text-xs text-ink-faint">Updated {article.updated}</p>

        <article className="mt-10 space-y-10">
          {article.sections.map((section) => (
            <section key={section.h2}>
              <h2 className="text-xl font-medium">{section.h2}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-relaxed text-ink-dim">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {article.faq.length > 0 ? (
            <section>
              <h2 className="text-xl font-medium">FAQ</h2>
              <div className="mt-4 space-y-5">
                {article.faq.map((item) => (
                  <div key={item.q}>
                    <h3 className="font-medium">{item.q}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <div className="mt-12 rounded-xl border border-edge bg-panel p-6">
          <p className="font-medium">See what your project would actually cost</p>
          <p className="mt-1 text-sm text-ink-dim">
            simdeploy analyze runs offline and prices every compatible architecture from provider
            price tables — before any deploy.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:bg-accent-dim"
          >
            Deploy now
          </Link>
        </div>

        {article.relatedDocs && article.relatedDocs.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-faint">
              Keep reading
            </h2>
            <ul className="space-y-2">
              {article.relatedDocs.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-accent hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-faint">
            More guides
          </h2>
          <ul className="space-y-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/learn/${item.slug}`} className="text-sm text-accent hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
