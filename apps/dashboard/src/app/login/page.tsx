import Link from "next/link";
import { redirect } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getSession } from "@/lib/auth/session";
import { githubOauthConfigured, isDev } from "@/lib/env";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_invalid: "Invalid or expired OAuth flow. Please try again.",
  oauth_failed: "GitHub authentication failed.",
  rate_limited: "Too many attempts. Please wait a moment.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const { error } = await searchParams;
  await trackEvent({ name: "signup_started" });

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-mono text-xl font-semibold">
          auto<span className="text-accent">cloud</span>
        </Link>
        <div className="rounded-xl border border-edge bg-panel p-6">
          <h1 className="mb-1 text-lg font-medium">Sign in</h1>
          <p className="mb-6 text-sm text-ink-dim">Deploy without choosing infrastructure.</p>

          {error ? (
            <p className="mb-4 rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
              {ERROR_MESSAGES[error] ?? "Authentication error."}
            </p>
          ) : null}

          {githubOauthConfigured() ? (
            <a
              href="/api/auth/github"
              className="mb-3 block rounded-md bg-ink px-4 py-2.5 text-center font-medium text-canvas hover:opacity-90"
            >
              Continue with GitHub
            </a>
          ) : (
            <p className="mb-3 rounded-md border border-edge bg-panel-2 px-3 py-2 text-xs text-ink-faint">
              GitHub OAuth not configured (set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).
            </p>
          )}

          {isDev() ? (
            <form method="post" action="/api/auth/dev-login">
              <button
                type="submit"
                className="w-full rounded-md border border-edge px-4 py-2.5 text-sm text-ink-dim hover:border-accent hover:text-ink"
              >
                Dev login (local environment only)
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
