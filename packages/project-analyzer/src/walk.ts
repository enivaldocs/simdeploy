import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface WalkedFile {
  /** Caminho relativo à raiz do projeto, com "/" como separador. */
  relPath: string;
  size: number;
  ext: string;
}

export interface WalkResult {
  files: WalkedFile[];
  truncated: boolean;
}

/** Diretórios nunca analisados (dependências, builds, VCS). */
export const DEFAULT_IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".simdeploy",
  "dist",
  "build",
  "out",
  "coverage",
  ".cache",
  "var",
]);

/**
 * Varredura bounded do projeto: nunca lê mais que maxFiles entradas, ignora
 * diretórios de build/deps. Determinística (ordem alfabética).
 */
export function walkProject(
  rootDir: string,
  {
    maxFiles = 20_000,
    ignoredDirs = DEFAULT_IGNORED_DIRS,
  }: {
    maxFiles?: number;
    ignoredDirs?: Set<string>;
  } = {},
): WalkResult {
  const files: WalkedFile[] = [];
  let truncated = false;

  const stack: string[] = [""];
  while (stack.length > 0) {
    const rel = stack.pop() as string;
    const abs = rel ? join(rootDir, rel) : rootDir;
    let entries: string[];
    try {
      entries = readdirSync(abs).sort().reverse();
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) {
        truncated = true;
        return { files, truncated };
      }
      const entryRel = rel ? `${rel}/${entry}` : entry;
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(join(rootDir, entryRel));
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (ignoredDirs.has(entry)) continue;
        stack.push(entryRel);
      } else if (st.isFile()) {
        const dotIdx = entry.lastIndexOf(".");
        files.push({
          relPath: entryRel,
          size: st.size,
          ext: dotIdx > 0 ? entry.slice(dotIdx + 1).toLowerCase() : "",
        });
      }
    }
  }
  return { files, truncated };
}
