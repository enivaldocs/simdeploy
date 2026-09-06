import Link from "next/link";
import { redirect } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getSession } from "@/lib/auth/session";
import { githubOauthConfigured } from "@/lib/env";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_invalid: "Invalid or expired OAuth flow. Please try again.",
  oauth_failed: "GitHub authentication failed.",
  rate_limited: "Too many attempts. Please wait a moment.",
  token_invalid: "Invalid, revoked or expired access token.",
  bad_credentials: "Wrong email or password.",
  email_taken: "That email is already registered. Sign in instead.",
  weak_password: "Password must be at least 8 characters.",
  register_failed: "Could not create the account. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const { error, mode } = await searchParams;
  await trackEvent({ name: "signup_started" });

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-mono text-xl font-semibold">
          sim<span className="text-accent">deploy</span>
        </Link>
        <div className="rounded-xl border border-edge bg-panel p-6">
          <h1 className="mb-1 text-lg font-medium">{isRegister ? "Create account" : "Sign in"}</h1>
          <p className="mb-6 text-sm text-ink-dim">Deploy without choosing infrastructure.</p>

          {error ? (
            <p className="mb-4 rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
              {ERROR_MESSAGES[error] ?? "Authentication error."}
            </p>
          ) : null}

          {githubOauthConfigured() ? (
            <>
              <a
                href="/api/auth/github"
                className="mb-4 block rounded-md bg-ink px-4 py-2.5 text-center font-medium text-canvas hover:opacity-90"
              >
                Continue with GitHub
              </a>
              <div className="mb-4 flex items-center gap-3 text-xs text-ink-faint">
                <span className="h-px flex-1 bg-edge" />
                or
                <span className="h-px flex-1 bg-edge" />
              </div>
            </>
          ) : null}

          {/* Email + senha */}
          <form
            method="post"
            action={isRegister ? "/api/auth/register" : "/api/auth/password-login"}
            className="mb-4 flex flex-col gap-2"
          >
            {isRegister ? (
              <input
                name="name"
                type="text"
                placeholder="Name (optional)"
                className="rounded-md border border-edge bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            ) : null}
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="rounded-md border border-edge bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder={isRegister ? "Password (8+ characters)" : "Password"}
              className="rounded-md border border-edge bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2.5 font-medium text-canvas hover:bg-accent-dim"
            >
              {isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mb-4 text-center text-sm text-ink-dim">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/login?mode=register" className="text-accent hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </p>

          <details className="border-t border-edge-soft pt-4">
            <summary className="cursor-pointer text-xs text-ink-faint hover:text-ink">
              Sign in with an access token (CLI users)
            </summary>
            <form method="post" action="/api/auth/token-login" className="mt-3">
              <input
                name="token"
                type="password"
                placeholder="sd_live_..."
                className="mb-2 w-full rounded-md border border-edge bg-panel-2 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="w-full rounded-md border border-edge px-4 py-2 text-sm text-ink-dim hover:border-accent hover:text-ink"
              >
                Continue with token
              </button>
            </form>
          </details>
        </div>
      </div>
    </main>
  );
}
