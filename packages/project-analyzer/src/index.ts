import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createFsContext,
  detectFramework,
  type FrameworkDetector,
} from "@simdeploy/framework-detector";
import type { PackageManager, ProjectAnalysis } from "@simdeploy/shared";
import { recommendArchitecture } from "./architecture.js";
import {
  computeStaticPercentage,
  countApiRoutes,
  countServerCodeFiles,
  readSourceSamples,
  scanBackgroundJobs,
  scanCronJobs,
  scanDatabase,
  scanEnvVars,
} from "./scanners.js";
import { walkProject } from "./walk.js";

export { recommendArchitecture } from "./architecture.js";
export { DEFAULT_IGNORED_DIRS, walkProject } from "./walk.js";

export interface AnalyzeOptions {
  maxFiles?: number;
  detectors?: FrameworkDetector[];
}

function detectPackageManager(
  rootDir: string,
  pkgManagerField: string | undefined,
): PackageManager | null {
  if (pkgManagerField) {
    const name = pkgManagerField.split("@")[0];
    if (name === "npm" || name === "pnpm" || name === "yarn" || name === "bun") return name;
  }
  if (existsSync(join(rootDir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(rootDir, "yarn.lock"))) return "yarn";
  if (existsSync(join(rootDir, "bun.lockb")) || existsSync(join(rootDir, "bun.lock"))) return "bun";
  if (existsSync(join(rootDir, "package-lock.json"))) return "npm";
  return null;
}

/**
 * Analisa um projeto local e produz um ProjectAnalysis determinístico.
 * Nenhuma rede, nenhum LLM: só filesystem + regras. Uma segunda camada de
 * análise assistida por IA pode ser plugada por cima deste resultado.
 */
export function analyzeProject(rootDir: string, options: AnalyzeOptions = {}): ProjectAnalysis {
  const ctx = createFsContext(rootDir);
  const detection = detectFramework(ctx, options.detectors);
  const { files, truncated } = walkProject(rootDir, { maxFiles: options.maxFiles });

  const warnings: string[] = [];
  if (truncated) {
    warnings.push("Projeto muito grande — análise limitada aos primeiros arquivos varridos.");
  }

  const sourceSamples = readSourceSamples(rootDir, files);
  const dbScan = scanDatabase(rootDir, ctx.packageJson);
  warnings.push(...dbScan.warnings);

  const apiRouteCount = countApiRoutes(detection.framework, files, sourceSamples);
  const serverFiles = countServerCodeFiles(detection.framework, files);
  const staticPercentage = computeStaticPercentage(detection.framework, files, serverFiles);
  const backgroundJobs = scanBackgroundJobs(ctx.packageJson);
  const cronJobs = scanCronJobs(rootDir, ctx.packageJson, sourceSamples);
  const hasDockerfile = existsSync(join(rootDir, "Dockerfile"));

  if (hasDockerfile) {
    warnings.push("Dockerfile detectado — deploy de containers ainda não é suportado no MVP.");
  }

  const requiresServer = detection.requiresServer || apiRouteCount > 0;

  const recommendedArchitecture = recommendArchitecture({
    framework: detection.framework,
    requiresServer: detection.requiresServer,
    apiRouteCount,
    staticPercentage,
    backgroundJobs,
    hasDockerfile,
  });

  return {
    schemaVersion: 1,
    framework: detection.framework,
    frameworkVersion: detection.version,
    runtime: detection.runtime,
    packageManager: detectPackageManager(rootDir, ctx.packageJson?.packageManager),
    buildCommand: detection.buildCommand,
    outputDir: detection.outputDir,
    fileCount: files.length,
    totalSizeBytes: files.reduce((sum, f) => sum + f.size, 0),
    staticPercentage,
    requiresServer,
    requiresDatabase: dbScan.databaseType !== null,
    databaseType: dbScan.databaseType,
    backgroundJobs,
    cronJobs,
    apiRouteCount,
    hasDockerfile,
    envVarsDetected: scanEnvVars(rootDir, sourceSamples),
    dependencies: Object.entries(ctx.packageJson?.dependencies ?? {}).map(([name, version]) => ({
      name,
      version,
    })),
    recommendedArchitecture,
    warnings,
  };
}
