import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Security",
  description:
    "How SimDeploy is secured: client-side builds, artifact validation, encrypted secrets, tenant isolation, audit logging and signed payment webhooks.",
  alternates: { canonical: "/security" },
};

const CONTROLS: Array<{ title: string; body: string }> = [
  {
    title: "Your code never runs on our servers",
    body: "Builds execute on your machine; the platform receives only the build output. Artifacts are validated before extraction: no symlinks, no path traversal, strict size and entry limits.",
  },
  {
    title: "Secrets encrypted at rest",
    body: "Environment variables are encrypted with AES-256-GCM before storage, never appear in logs and are never displayed after being saved. Changes are audit-logged by key name only.",
  },
  {
    title: "Tenant isolation",
    body: "Every query is scoped by organization derived from the authenticated context — never from request input. API tokens are stored as SHA-256 hashes with per-token scopes, expiration and revocation.",
  },
  {
    title: "Verified deployments",
    body: "Every deployment ends with a real HTTP health check against the published URL. Non-2xx responses fail the deploy — broken releases do not go live silently.",
  },
  {
    title: "Payment integrity",
    body: "Payment state changes only through Stripe webhooks with validated signatures, deduplication and controlled retries — never from the frontend. Card data never touches SimDeploy servers.",
  },
  {
    title: "Audit trail",
    body: "Sensitive actions — plan changes, credit entries, permission and configuration changes — are recorded with before/after state, actor, IP and user agent.",
  },
  {
    title: "Serving protections",
    body: "Published sites are served with path-traversal protection and a content-type allowlist. Rate limiting applies per identity on the API, per IP on authentication, and per organization on deploys.",
  },
];

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold">Security</h1>
        <p className="mt-2 max-w-2xl text-ink-dim">
          The platform is designed around one assumption: deployed code is untrusted. These are the
          controls actually in place — not aspirations.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CONTROLS.map((control) => (
            <div key={control.title} className="rounded-xl border border-edge bg-panel p-5">
              <h2 className="font-medium">{control.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">{control.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-dim">
          Found a vulnerability? Report it to{" "}
          <a href="mailto:support@simdeploy.com" className="text-accent hover:underline">
            support@simdeploy.com
          </a>
          . Good-faith research on your own account is welcome. See also the{" "}
          <a href="/dpa" className="text-accent hover:underline">
            Data Processing Agreement
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
