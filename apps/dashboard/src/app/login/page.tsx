import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { githubOauthConfigured, isDev } from "@/lib/env";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_invalid: "Fluxo OAuth inválido ou expirado. Tente novamente.",
  oauth_failed: "Falha ao autenticar com o GitHub.",
  rate_limited: "Muitas tentativas. Aguarde um instante.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const { error } = await searchParams;

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
              {ERROR_MESSAGES[error] ?? "Erro ao autenticar."}
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
              GitHub OAuth não configurado (defina GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).
            </p>
          )}

          {isDev() ? (
            <form method="post" action="/api/auth/dev-login">
              <button
                type="submit"
                className="w-full rounded-md border border-edge px-4 py-2.5 text-sm text-ink-dim hover:border-accent hover:text-ink"
              >
                Dev login (somente ambiente local)
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
