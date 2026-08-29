"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface EnvVarItem {
  id: string;
  key: string;
  target: string;
  updatedAt: string;
}

export function EnvVarsPanel({ projectId, envVars }: { projectId: string; envVars: EnvVarItem[] }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [target, setTarget] = useState<"all" | "production" | "preview">("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/v1/projects/${projectId}/env`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, target }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Falha ao salvar.");
      return;
    }
    setKey("");
    setValue("");
    router.refresh();
  }

  async function remove(k: string) {
    await fetch(`/api/v1/projects/${projectId}/env/${encodeURIComponent(k)}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={save} className="mb-6 flex flex-wrap items-center gap-2">
        <input
          value={key}
          onChange={(event) => setKey(event.target.value.toUpperCase())}
          placeholder="KEY"
          className="w-48 rounded-md border border-edge bg-panel-2 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="value"
          type="password"
          className="w-64 rounded-md border border-edge bg-panel-2 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value as typeof target)}
          className="rounded-md border border-edge bg-panel-2 px-2 py-2 text-sm"
        >
          <option value="all">All environments</option>
          <option value="production">Production</option>
          <option value="preview">Preview</option>
        </select>
        <button
          type="submit"
          disabled={busy || !key || !value}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
        >
          Save
        </button>
        {error ? <span className="text-xs text-err">{error}</span> : null}
      </form>

      <div className="overflow-hidden rounded-lg border border-edge">
        {envVars.length === 0 ? (
          <p className="bg-panel p-5 text-sm text-ink-faint">Nenhuma variável definida.</p>
        ) : (
          <table className="w-full bg-panel text-sm">
            <tbody>
              {envVars.map((envVar) => (
                <tr key={envVar.id} className="border-b border-edge-soft last:border-0">
                  <td className="px-4 py-3 font-mono">{envVar.key}</td>
                  <td className="px-4 py-3 font-mono text-ink-faint">••••••••</td>
                  <td className="px-4 py-3 text-xs text-ink-faint">{envVar.target}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(envVar.key)}
                      className="text-xs text-ink-faint hover:text-err"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Valores são criptografados em repouso e nunca são exibidos depois de salvos.
      </p>
    </div>
  );
}
