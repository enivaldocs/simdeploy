import Link from "next/link";

/** Header compartilhado das páginas públicas. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="font-mono text-lg font-semibold tracking-tight">
        auto<span className="text-accent">cloud</span>
      </Link>
      <nav className="flex items-center gap-6 text-sm text-ink-dim">
        <Link href="/learn" className="hover:text-ink">
          Learn
        </Link>
        <Link href="/pricing" className="hover:text-ink">
          Pricing
        </Link>
        <Link href="/docs/agents" className="hover:text-ink">
          Agents
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-edge px-3 py-1.5 hover:border-accent hover:text-ink"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="hidden rounded-md bg-accent px-3 py-1.5 font-medium text-canvas hover:bg-accent-dim sm:block"
        >
          Start free
        </Link>
      </nav>
    </header>
  );
}
