import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How AutoCloud collects, uses and protects personal data — legal bases (LGPD), subprocessors, retention and data subject rights.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Who we are",
    paragraphs: [
      "AutoCloud is operated by Yes Servicos Digitais (data controller under Brazilian law 13.709/2018 — LGPD). Data protection officer contact: support@autocloud.app.",
    ],
  },
  {
    title: "2. What we collect",
    paragraphs: [
      "Account data: email, name and — if you connect GitHub — your GitHub account's public identifier and login.",
      "Product usage data: projects, deployments, pipeline logs, measured traffic metrics for your sites (request and byte counts — we do not record the IP or identity of your sites' visitors), and product events (e.g. deployment completed, checkout started).",
      "Billing data: plan, invoices and payment status. Card data is collected and stored exclusively by Stripe — it never touches our servers.",
      "Cookies: a session cookie (authentication, essential) and a first-touch attribution cookie (utm/referrer of the first visit, expires in 30 days). We do not use third-party advertising cookies.",
      "Your projects' environment variables are encrypted (AES-256-GCM) before being stored, never appear in logs and are never displayed after being saved.",
    ],
  },
  {
    title: "3. Why we use it (legal bases)",
    paragraphs: [
      "To provide the contracted service — publishing, serving and metering your projects (performance of contract).",
      "Billing, fraud prevention and tax obligations (legal obligation and legitimate interest).",
      "Improving the product from aggregated usage and acquisition-source events (legitimate interest).",
      "Transactional communications — deploy failures, payment failures, usage limits (performance of contract). We do not send marketing without consent.",
    ],
  },
  {
    title: "4. Who we share with (subprocessors)",
    paragraphs: [
      "We use strictly necessary subprocessors: the infrastructure providers where your projects are published (e.g. Cloudflare) and Stripe for payments. Each receives only what its function requires.",
      "We do not sell personal data. Data may be disclosed to authorities under legal obligation.",
    ],
  },
  {
    title: "5. Retention and security",
    paragraphs: [
      "Account and billing data are kept while the account exists and for the legally required tax periods after closure. Pipeline logs and usage metrics are operational data and may be purged periodically.",
      "Security measures include: encryption of secrets at rest, API tokens stored only as hashes, per-organization isolation in every query, audit logging of sensitive actions, and signature validation on payment webhooks.",
    ],
  },
  {
    title: "6. Your rights (LGPD)",
    paragraphs: [
      "You may request: confirmation of processing, access, correction, anonymization, portability, deletion and consent withdrawal — via support@autocloud.app. We respond within the timeframes set by the LGPD.",
      "Closing your account unpublishes your projects and starts deletion of personal data, except what we must keep under legal obligation.",
    ],
  },
  {
    title: "7. Changes",
    paragraphs: [
      "This policy may be updated; relevant changes are communicated. The last-updated date is at the top of the page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
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
