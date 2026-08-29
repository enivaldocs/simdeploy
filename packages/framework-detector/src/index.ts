import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_DETECTORS } from "./detectors.js";
import type {
  DetectionContext,
  FrameworkDetection,
  FrameworkDetector,
  PackageJsonLike,
} from "./types.js";

export { DEFAULT_DETECTORS } from "./detectors.js";
export { getDependencyVersion, hasDependency } from "./types.js";
export type { DetectionContext, FrameworkDetection, FrameworkDetector, PackageJsonLike };

const UNKNOWN: FrameworkDetection = {
  framework: "unknown",
  version: null,
  buildCommand: null,
  outputDir: null,
  runtime: "static",
  requiresServer: false,
};

/**
 * Roda o registry de detectores em ordem de prioridade e retorna o primeiro
 * match. Determinístico — nenhuma chamada de rede ou LLM.
 */
export function detectFramework(
  ctx: DetectionContext,
  detectors: FrameworkDetector[] = DEFAULT_DETECTORS,
): FrameworkDetection {
  const ordered = [...detectors].sort((a, b) => b.priority - a.priority);
  for (const detector of ordered) {
    const result = detector.detect(ctx);
    if (result) return result;
  }
  return UNKNOWN;
}

/** Contexto de detecção sobre o filesystem real. */
export function createFsContext(rootDir: string): DetectionContext {
  let packageJson: PackageJsonLike | null = null;
  const pkgPath = join(rootDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      packageJson = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJsonLike;
    } catch {
      packageJson = null;
    }
  }
  return {
    packageJson,
    fileExists: (relPath) => existsSync(join(rootDir, relPath)),
    readFile: (relPath) => {
      try {
        return readFileSync(join(rootDir, relPath), "utf8");
      } catch {
        return null;
      }
    },
  };
}
