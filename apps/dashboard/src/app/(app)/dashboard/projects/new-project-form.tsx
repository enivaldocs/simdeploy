"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Falha ao criar projeto.");
      return;
    }
    setName("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:bg-accent-dim"
      >
        New project
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="project name"
        className="rounded-md border border-edge bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy || name.trim().length === 0}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
      >
        {busy ? "Creating" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-2 py-2 text-sm text-ink-faint hover:text-ink"
      >
        Cancel
      </button>
      {error ? <span className="text-xs text-err">{error}</span> : null}
    </form>
  );
}
