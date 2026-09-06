import Link from "next/link";
import { redirect } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getSession } from "@/lib/auth/session";
import { githubOauthConfigured, isDev } from "@/lib/env";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_invalid: "Invalid or expired OAuth flow. Please try again.",
  oauth_failed: "GitHub authentication failed.",
  rate_limited: "Too many attempts. Please wait a moment.",
  token_invalid: "Invalid, revoked or expired access token.",
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
          ) : null}

          <form method="post" action="/api/auth/token-login" className="mb-3">
            <label htmlFor="token" className="mb-1.5 block text-xs text-ink-faint">
              Sign in with an access token (CLI users)
            </label>
            <input
              id="token"
              name="token"
              type="password"
              placeholder="sd_live_..."
              className="mb-2 w-full rounded-md border border-edge bg-panel-2 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="w-full rounded-md border border-edge px-4 py-2.5 text-sm text-ink-dim hover:border-accent hover:text-ink"
            >
              Continue with token
            </button>
          </form>

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
