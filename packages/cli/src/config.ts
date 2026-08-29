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
