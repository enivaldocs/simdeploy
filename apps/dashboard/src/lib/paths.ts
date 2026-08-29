import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Diretórios de runtime do servidor (gitignored em var/). Em produção isso
 * vira storage de objetos (R2/S3) atrás da mesma interface de provider.
 */
const ROOT = resolve(process.cwd(), "..", "..");

export function varDir(...parts: string[]): string {
  const dir = join(ROOT, "var", ...parts);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const sitesDir = () => varDir("sites");
export const artifactsDir = () => varDir("artifacts");
