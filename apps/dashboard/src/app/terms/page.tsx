import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Terms of Service",
  description:
    "AutoCloud Terms of Service: account, plans and payment, acceptable use, user content, cancellation and refunds.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. The service",
    paragraphs: [
      "AutoCloud is a deployment and hosting platform operated by Yes Servicos Digitais (Brazil). It analyzes software projects, automatically selects the infrastructure architecture, publishes the project to a URL and measures usage (requests, bandwidth, storage).",
      "Infrastructure cost figures shown in the product are projections computed from public provider price tables and are always labeled as estimates. The only real charge is your subscription, described in section 3.",
    ],
  },
  {
    title: "2. Account",
    paragraphs: [
      "You are responsible for the security of your account credentials and of the API tokens created in it. Tokens can be revoked at any time in the dashboard.",
      "We may suspend accounts that violate these terms, with the reason recorded and communicated to the account holder.",
    ],
  },
  {
    title: "3. Plans, payment and refunds",
    paragraphs: [
      "Plans have a fixed monthly (or annual) price with explicit limits shown on the pricing page and in the dashboard. Payments are processed by Stripe; AutoCloud never stores card data.",
      "You can change plans or cancel at any time through the billing portal. Cancellation takes effect at the next cycle; access remains until the end of the paid period.",
      "Online purchases carry a 7 (seven) calendar day right of withdrawal from the date of purchase, with a full refund (article 49 of the Brazilian Consumer Code). To exercise it, contact support@autocloud.app.",
      "Failed payments are notified; after the grace period, the subscription reverts to the free plan and its limits apply.",
    ],
  },
  {
    title: "4. Acceptable use",
    paragraphs: [
      "You may not use AutoCloud to host or distribute: malware, phishing or pages impersonating third parties; content that infringes copyright or violates applicable law; spam or abuse infrastructure (including attacks against third parties); cryptocurrency mining; child sexual abuse material (removed and reported immediately).",
      "It is also prohibited to circumvent plan limits, interfere with the platform or with other customers' projects, or resell the service without a written agreement.",
      "Projects that violate this section may be unpublished immediately. Whenever possible we notify first; for active abuse against third parties we act first and notify afterwards. See the full Acceptable Use Policy.",
    ],
  },
  {
    title: "5. User content and responsibility",
    paragraphs: [
      "The code and content you publish are yours and remain yours. You grant us only the technical license needed to store, process and serve that content — which is the service itself.",
      "By security design, your code is built on your machine (CLI); the platform receives and serves only the build output. You are legally responsible for the content you publish.",
    ],
  },
  {
    title: "6. Availability",
    paragraphs: [
      "We work to keep the service available. At this stage of the product there is no formal contractual SLA; relevant outages are communicated to affected customers.",
      "Platform database backups run regularly. Keeping a copy of your projects' source code is your responsibility (the standard flow publishes from your repository/machine).",
    ],
  },
  {
    title: "7. Changes and termination",
    paragraphs: [
      "These terms may be updated; relevant changes are communicated with reasonable notice. Continued use after the new version takes effect constitutes acceptance.",
      "You may close your account at any time. Upon closure, projects are unpublished and data is handled according to the Privacy Policy.",
    ],
  },
  {
    title: "8. Contact and governing law",
    paragraphs: [
      "Questions about these terms: support@autocloud.app. These terms are governed by Brazilian law.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
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
