import type { MetadataRoute } from "next";
import { DOC_PAGES } from "@/lib/docs-content";
import { LANDING_PAGES } from "@/lib/landings";
import { LEARN_ARTICLES } from "@/lib/learn-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs/agents`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/claude-code`, changeFrequency: "weekly", priority: 0.9 },
    ...DOC_PAGES.map((page) => ({
      url: `${base}/docs/${page.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/changelog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/security`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/acceptable-use`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/dpa`, changeFrequency: "monthly", priority: 0.3 },
    ...Object.keys(LANDING_PAGES).map((slug) => ({
      url: `${base}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/learn`, changeFrequency: "weekly" as const, priority: 0.8 },
    ...LEARN_ARTICLES.map((article) => ({
      url: `${base}/learn/${article.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
