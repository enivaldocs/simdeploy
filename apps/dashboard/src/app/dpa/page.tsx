import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Data Processing Agreement",
  description:
    "How AutoCloud acts as processor for personal data contained in customer projects, under the Brazilian LGPD.",
  alternates: { canonical: "/dpa" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Roles",
    paragraphs: [
      "For YOUR account data (email, billing, usage), Yes Servicos Digitais is the controller — see the Privacy Policy.",
      "For personal data possibly contained in the PROJECTS you publish (code, served content, environment variables), you are the controller and AutoCloud acts as processor (article 5, VII, LGPD), processing that data exclusively to provide the service: storing, publishing and serving your project.",
    ],
  },
  {
    title: "2. Instructions and purpose",
    paragraphs: [
      "We process your projects' data only according to your instructions as expressed through the product itself (deploying, configuring variables, deleting). We do not access your projects' content except to operate the service, handle a support request from you, or comply with a legal obligation.",
    ],
  },
  {
    title: "3. Security",
    paragraphs: [
      "Technical measures in place: environment variables encrypted at rest (AES-256-GCM); per-organization isolation in every query; builds executed outside the platform's servers; artifacts validated before extraction; tokens stored only as hashes; audit logging of sensitive actions.",
    ],
  },
  {
    title: "4. Subprocessors",
    paragraphs: [
      "We use strictly necessary subprocessors: the infrastructure providers where projects are published (e.g. Cloudflare) and Stripe for payments (billing data, not your projects' data). Relevant changes to this list are communicated.",
    ],
  },
  {
    title: "5. Incidents, return and deletion",
    paragraphs: [
      "Security incidents involving personal data are communicated to the affected customer without undue delay, with the information required by the LGPD.",
      "Upon account closure or project deletion, published content is unpublished and artifacts are deleted from our systems, except backup copies purged on a regular cycle.",
      "Questions and requests: support@autocloud.app.",
    ],
  },
];

export default function DpaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Data Processing Agreement</h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated: August 29, 2026</p>
        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-medium">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-dim">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
