import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface CliConfig {
  apiUrl: string;
  token?: string;
}

export interface ProjectLink {
  projectId: string;
  slug: string;
  name: string;
}

const CONFIG_DIR = join(homedir(), ".autocloud");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const DEFAULT_API_URL = process.env.AUTOCLOUD_API_URL ?? "http://localhost:3000";

export function readConfig(): CliConfig {
  try {
    return { apiUrl: DEFAULT_API_URL, ...JSON.parse(readFileSync(CONFIG_FILE, "utf8")) };
  } catch {
    return { apiUrl: DEFAULT_API_URL };
  }
}

export function writeConfig(config: CliConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

/** Link projeto local ↔ projeto AutoCloud (fica em .autocloud/project.json). */
export function readProjectLink(rootDir: string): ProjectLink | null {
  try {
    return JSON.parse(
      readFileSync(join(rootDir, ".autocloud", "project.json"), "utf8"),
    ) as ProjectLink;
  } catch {
    return null;
  }
}

const AGENTS_MD_SNIPPET = `# Agent guide

## Deploy

This project deploys with AutoCloud.

- Publish: \`autocloud deploy --yes\` (prints the public URL; non-zero exit on failure)
- Diagnose a failed deploy: \`autocloud logs\`
- Architecture and cost preview (offline): \`autocloud analyze --json\`

Deployment states are typed (READY, BUILD_FAILED, DEPLOY_FAILED, ...) — branch on them.
`;

/**
 * Growth loop agent-first: o primeiro deploy deixa instruções que QUALQUER
 * coding agent futuro (Claude Code, Codex, Cursor) lê ao abrir o projeto.
 * Só cria AGENTS.md quando ele não existe — nunca sobrescreve arquivo do
 * usuário.
 */
export function writeAgentsGuidance(rootDir: string): "created" | "exists" | "hint" {
  const agentsPath = join(rootDir, "AGENTS.md");
  if (!existsSync(agentsPath)) {
    writeFileSync(agentsPath, AGENTS_MD_SNIPPET);
    return "created";
  }
  const content = readFileSync(agentsPath, "utf8");
  return content.toLowerCase().includes("autocloud") ? "exists" : "hint";
}

export function writeProjectLink(rootDir: string, link: ProjectLink): void {
  const dir = join(rootDir, ".autocloud");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "project.json"), `${JSON.stringify(link, null, 2)}\n`);
  const gitignore = join(rootDir, ".gitignore");
  // Garante que o link (local) não vá para o repositório do usuário.
  if (existsSync(gitignore)) {
    const content = readFileSync(gitignore, "utf8");
    if (!content.includes(".autocloud")) {
      writeFileSync(gitignore, `${content.trimEnd()}\n.autocloud/\n`);
    }
  }
}
