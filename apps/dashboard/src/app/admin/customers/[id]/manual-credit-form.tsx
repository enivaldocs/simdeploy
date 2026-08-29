"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Entrada manual no ledger (crédito ou débito) — auditada no backend. */
export function ManualCreditForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const amountMinor = Math.round(Number(amount.replace(",", ".")) * 100);
    const response = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, amountMinor, reason }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Falha ao lançar crédito.");
      return;
    }
    setAmount("");
    setReason("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-xs text-ink-dim hover:border-accent hover:text-ink"
      >
        Manual credit entry
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="valor em R$ (negativo = débito)"
        className="w-52 rounded-md border border-edge bg-panel-2 px-3 py-1.5 font-mono text-xs outline-none focus:border-accent"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="motivo (obrigatório)"
        className="w-64 rounded-md border border-edge bg-panel-2 px-3 py-1.5 text-xs outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy || !amount || !reason}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-canvas disabled:opacity-50"
      >
        {busy ? "Saving" : "Add entry"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-faint">
        Cancel
      </button>
      {error ? <span className="text-xs text-err">{error}</span> : null}
    </form>
  );
}
