"use client";

import { useState } from "react";

export function UpgradeButton({
  planSlug,
  planName,
  disabled,
}: {
  planSlug: string;
  planName: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug, interval: "monthly" }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(body?.error?.message ?? "Falha ao iniciar checkout.");
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={checkout}
        disabled={busy || disabled}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:bg-accent-dim disabled:opacity-50"
      >
        {busy ? "Redirecting" : `Upgrade to ${planName}`}
      </button>
      {error ? <p className="mt-2 text-xs text-err">{error}</p> : null}
    </div>
  );
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    const response = await fetch("/api/v1/billing/portal", { method: "POST" });
    const body = await response.json().catch(() => null);
    setBusy(false);
    if (response.ok && body?.url) window.location.href = body.url;
  }
  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="rounded-md border border-edge px-4 py-2 text-sm text-ink-dim hover:border-accent hover:text-ink disabled:opacity-50"
    >
      Manage subscription
    </button>
  );
}
