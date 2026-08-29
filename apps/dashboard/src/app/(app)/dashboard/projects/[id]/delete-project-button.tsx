"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProjectButton({ projectId, name }: { projectId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function destroy() {
    setBusy(true);
    const response = await fetch(`/api/v1/projects/${projectId}`, { method: "DELETE" });
    setBusy(false);
    if (response.ok) router.push("/dashboard/projects");
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-err/40 px-4 py-2 text-sm text-err hover:bg-err/10"
      >
        Delete project
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-dim">
        Remover <span className="font-medium text-ink">{name}</span> e todos os deployments?
      </span>
      <button
        type="button"
        onClick={destroy}
        disabled={busy}
        className="rounded-md bg-err px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
      >
        {busy ? "Deleting" : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-ink-faint hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}
