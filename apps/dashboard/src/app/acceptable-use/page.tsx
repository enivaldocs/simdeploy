import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Acceptable Use Policy",
  description:
    "What may and may not be hosted on AutoCloud, and how we handle violations and abuse reports.",
  alternates: { canonical: "/acceptable-use" },
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Principle",
    paragraphs: [
      "AutoCloud publishes third-party software to the internet. This policy defines prohibited uses and how we act when they occur. It is part of the Terms of Service.",
    ],
  },
  {
    title: "2. Prohibited content and activities",
    paragraphs: [
      "Malware, ransomware, command-and-control, or any code designed to compromise third-party systems.",
      "Phishing and pages impersonating another company, brand or person — including fake login screens and collection of credentials or payment data under false pretenses.",
      "Child sexual abuse material: immediate removal and report to the competent authorities.",
      "Copyright infringement and distribution of content that is illegal under applicable law.",
      "Spam in any form: sending, sending infrastructure, or landing pages for spam campaigns.",
      "Attacks on third parties: DDoS, abusive scraping, brute force, unauthorized scanning.",
      "Cryptocurrency mining and any use designed to consume resources beyond plan limits.",
    ],
  },
  {
    title: "3. Platform use",
    paragraphs: [
      "Circumventing plan limits, interfering with other customers' projects, exploiting platform vulnerabilities (report them instead) or reselling the service without a written agreement is prohibited.",
      "Good-faith security research on your own account is welcome; report findings to support@autocloud.app.",
    ],
  },
  {
    title: "4. Enforcement",
    paragraphs: [
      "Violations lead to unpublishing of the project and, in serious or repeated cases, account suspension. Whenever possible we notify first; for active abuse against third parties we unpublish first and notify afterwards. Every action is recorded in the audit log.",
      "To report abuse hosted on AutoCloud: support@autocloud.app with the URL and a description of the issue.",
    ],
  },
];

export default function AcceptableUsePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Acceptable Use Policy</h1>
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
