"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FxRateForm({ currentRate }: { currentRate: number | null }) {
  const router = useRouter();
  const [rate, setRate] = useState(currentRate?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const parsed = Number(rate.replace(",", "."));
    const response = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "fx_rate_usd_brl", value: { rate: parsed } }),
    });
    setBusy(false);
    setMessage(response.ok ? "Salvo." : "Falha ao salvar.");
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        placeholder="ex.: 5.40"
        className="w-32 rounded-md border border-edge bg-panel-2 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy || !rate}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
      >
        Save rate
      </button>
      {message ? <span className="text-xs text-ink-faint">{message}</span> : null}
    </form>
  );
}

const KNOWN_FLAGS = ["autopilot", "mcp", "usage_billing", "new_providers", "beta_features"];

export function FeatureFlagsForm({ flags }: { flags: Record<string, { enabled: boolean }> }) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(KNOWN_FLAGS.map((key) => [key, flags[key]?.enabled ?? false])),
  );
  const [busy, setBusy] = useState(false);

  async function toggle(key: string) {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    setBusy(true);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "feature_flags",
        value: Object.fromEntries(
          Object.entries(next).map(([flagKey, enabled]) => [flagKey, { enabled }]),
        ),
      }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {KNOWN_FLAGS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={busy}
          onClick={() => toggle(key)}
          className={`rounded-full border px-3 py-1 font-mono text-xs ${
            state[key] ? "border-accent/60 bg-accent/10 text-accent" : "border-edge text-ink-faint"
          }`}
        >
          {key}: {state[key] ? "on" : "off"}
        </button>
      ))}
    </div>
  );
}

export function PlanEditForm({
  plan,
}: {
  plan: { id: string; slug: string; priceMonthlyMinor: number; priceAnnualMinor: number | null };
}) {
  const router = useRouter();
  const [monthly, setMonthly] = useState(String(plan.priceMonthlyMinor / 100));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const priceMonthlyMinor = Math.round(Number(monthly.replace(",", ".")) * 100);
    const response = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceMonthlyMinor }),
    });
    setBusy(false);
    setMessage(response.ok ? "Salvo" : "Erro");
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <span className="text-xs text-ink-faint">R$</span>
      <input
        value={monthly}
        onChange={(e) => setMonthly(e.target.value)}
        className="w-24 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-xs outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-edge px-3 py-1 text-xs text-ink-dim hover:border-accent hover:text-ink disabled:opacity-50"
      >
        Save
      </button>
      {message ? <span className="text-xs text-ink-faint">{message}</span> : null}
    </form>
  );
}
