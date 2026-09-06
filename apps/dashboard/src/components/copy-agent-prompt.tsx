"use client";

import { useState } from "react";

const AGENT_PROMPT = `Deploy this project to SimDeploy:
1. Install the CLI: npm i -g simdeploy
2. Authenticate: simdeploy login --token <create one at /dashboard/settings>
3. Inspect first (offline): simdeploy analyze --json
4. Deploy non-interactively: simdeploy deploy --yes
5. On failure, read: simdeploy logs
Full agent contract: /llms.txt and /docs/agents`;

/**
 * "Onboard your agent": copia um prompt operacional pronto para colar no
 * coding agent do visitante (Claude Code, Codex, Cursor).
 */
export function CopyAgentPrompt() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard indisponível — sem fallback ruidoso
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-edge px-6 py-3 font-mono text-sm text-ink-dim hover:border-accent hover:text-ink"
    >
      {copied ? "Copied — paste it into your agent" : "Onboard your agent"}
    </button>
  );
}
