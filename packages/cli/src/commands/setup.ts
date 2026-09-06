import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { check, heading, info } from "../output.js";

/**
 * `simdeploy setup` — prepara um projeto para ser deployado por um coding
 * agent em UM comando: registra o MCP server para Claude Code e Cursor e
 * grava as instruções de deploy que o agente lê ao abrir o repositório.
 *
 * Objetivo: quando alguém pede a um agente "deploy this", tudo já está no
 * lugar para ele publicar sem configuração.
 */

const MCP_ENTRY = { command: "simdeploy-mcp" };

const AGENTS_MD = `# Agent guide

## Deploy

This project deploys with SimDeploy (https://simdeploy.com).

- Publish: \`npx simdeploy deploy --yes\` — prints the public URL; non-zero exit on failure.
- Diagnose a failed deploy: \`npx simdeploy logs\`
- Architecture and cost preview (offline, no upload): \`npx simdeploy analyze --json\`

Deployment states are typed (READY, BUILD_FAILED, DEPLOY_FAILED, ANALYSIS_FAILED) — branch on them.
If ANALYSIS_FAILED on a Next.js app, set \`output: "export"\` in next.config for a static deploy.
Full agent contract: https://simdeploy.com/llms.txt
`;

function mergeJsonMcp(path: string, serverKey: string): "created" | "updated" | "present" {
  let data: { mcpServers?: Record<string, unknown> } = {};
  if (existsSync(path)) {
    try {
      data = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      data = {};
    }
  }
  data.mcpServers = data.mcpServers ?? {};
  if (data.mcpServers[serverKey]) return "present";
  const existed = existsSync(path);
  data.mcpServers[serverKey] = MCP_ENTRY;
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  return existed ? "updated" : "created";
}

export async function setupCommand(options: { dir?: string }): Promise<void> {
  const rootDir = options.dir ?? process.cwd();
  heading();
  console.log(pc.bold("Setting up SimDeploy for coding agents\n"));

  // 1. Claude Code / generic: .mcp.json
  const claude = mergeJsonMcp(join(rootDir, ".mcp.json"), "simdeploy");
  check(`.mcp.json (${claude}) — Claude Code and MCP-aware agents`);

  // 2. Cursor: .cursor/mcp.json
  const { mkdirSync } = await import("node:fs");
  mkdirSync(join(rootDir, ".cursor"), { recursive: true });
  const cursor = mergeJsonMcp(join(rootDir, ".cursor", "mcp.json"), "simdeploy");
  check(`.cursor/mcp.json (${cursor}) — Cursor`);

  // 3. AGENTS.md — read by any agent opening the repo
  const agentsPath = join(rootDir, "AGENTS.md");
  if (!existsSync(agentsPath)) {
    writeFileSync(agentsPath, AGENTS_MD);
    check("AGENTS.md created — deploy instructions for any agent");
  } else {
    const content = readFileSync(agentsPath, "utf8");
    if (!content.toLowerCase().includes("simdeploy")) {
      writeFileSync(agentsPath, `${content.trimEnd()}\n\n${AGENTS_MD}`);
      check("AGENTS.md updated with SimDeploy deploy section");
    } else {
      check("AGENTS.md already mentions SimDeploy");
    }
  }

  console.log();
  info("Next:");
  info(
    "  1. simdeploy login --token sd_live_...  (create at https://simdeploy.com/dashboard/settings)",
  );
  info("  2. Ask your agent to deploy, or run: simdeploy deploy --yes");
  console.log(
    `\n${pc.dim("The MCP server gives agents: analyze, deploy, logs, cost — no config.")}\n`,
  );
}
