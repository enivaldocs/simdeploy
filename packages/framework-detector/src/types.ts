import type { FrameworkId, RuntimeKind } from "@autocloud/shared";

export interface PackageJsonLike {
  name?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

/**
 * Acesso ao projeto abstraído — permite detectar sobre fs real, fixtures de
 * teste ou (futuro) uma árvore vinda da API do GitHub sem clone.
 */
export interface DetectionContext {
  packageJson: PackageJsonLike | null;
  fileExists(relPath: string): boolean;
  readFile(relPath: string): string | null;
}

export interface FrameworkDetection {
  framework: FrameworkId;
  version: string | null;
  buildCommand: string | null;
  outputDir: string | null;
  runtime: RuntimeKind;
  requiresServer: boolean;
}

export interface FrameworkDetector {
  id: FrameworkId;
  /** Maior prioridade vence (frameworks mais específicos primeiro). */
  priority: number;
  detect(ctx: DetectionContext): FrameworkDetection | null;
}

export function getDependencyVersion(pkg: PackageJsonLike | null, name: string): string | null {
  const raw = pkg?.dependencies?.[name] ?? pkg?.devDependencies?.[name] ?? null;
  if (!raw) return null;
  return raw.replace(/^[\^~>=<]+/, "").trim() || raw;
}

export function hasDependency(pkg: PackageJsonLike | null, name: string): boolean {
  return Boolean(pkg?.dependencies?.[name] ?? pkg?.devDependencies?.[name]);
}
