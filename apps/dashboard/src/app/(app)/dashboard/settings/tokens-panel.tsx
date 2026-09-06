"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL_SCOPES = [
  "projects:read",
  "projects:write",
  "deployments:read",
  "deployments:write",
  "logs:read",
  "env:read",
  "env:write",
  "cost:read",
];

interface TokenItem {
  id: string;
  name: string;
  displayPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export function TokensPanel({ tokens }: { tokens: TokenItem[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(ALL_SCOPES);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes }),
    });
    setBusy(false);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error?.message ?? "Falha ao criar token.");
      return;
    }
    setCreatedToken(body.token);
    setName("");
    router.refresh();
  }

  async function revoke(id: string) {
    await fetch(`/api/v1/tokens/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function toggleScope(scope: string) {
    setScopes((current) =>
      current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope],
    );
  }

  return (
    <div>
      {createdToken ? (
        <div className="mb-6 rounded-lg border border-accent/50 bg-accent/10 p-4">
          <p className="mb-2 text-sm">
            Token criado. Copie agora — ele não será exibido novamente.
          </p>
          <code className="block select-all break-all rounded-md bg-panel-2 p-3 font-mono text-xs">
            {createdToken}
          </code>
          <p className="mt-2 font-mono text-xs text-ink-faint">
            simdeploy login --token {"<token>"}
          </p>
          <button
            type="button"
            onClick={() => setCreatedToken(null)}
            className="mt-2 text-xs text-ink-dim hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form onSubmit={create} className="mb-6 rounded-lg border border-edge bg-panel p-5">
        <h2 className="mb-3 text-sm font-medium">Create API token</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="token name (ex.: cli-macbook)"
          className="mb-3 w-72 rounded-md border border-edge bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {ALL_SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => toggleScope(scope)}
              className={`rounded-full border px-3 py-1 font-mono text-xs ${
                scopes.includes(scope)
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-edge text-ink-faint"
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={busy || !name || scopes.length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
        >
          {busy ? "Creating" : "Create token"}
        </button>
        {error ? <span className="ml-3 text-xs text-err">{error}</span> : null}
      </form>

      <div className="overflow-hidden rounded-lg border border-edge">
        {tokens.length === 0 ? (
          <p className="bg-panel p-5 text-sm text-ink-faint">Nenhum token ativo.</p>
        ) : (
          <table className="w-full bg-panel text-sm">
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b border-edge-soft last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{token.name}</p>
                    <p className="font-mono text-xs text-ink-faint">{token.displayPrefix}…</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-faint">
                    {token.scopes.length === ALL_SCOPES.length
                      ? "all scopes"
                      : token.scopes.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-faint">
                    {token.lastUsedAt ? `used ${token.lastUsedAt.slice(0, 10)}` : "never used"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => revoke(token.id)}
                      className="text-xs text-ink-faint hover:text-err"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
