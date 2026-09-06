import { z } from "zod";

/**
 * Frameworks reconhecidos pelo detector. Extensível: novos frameworks são
 * adicionados registrando um detector em @simdeploy/framework-detector e
 * incluindo o id aqui.
 */
export const FRAMEWORK_IDS = [
  "nextjs",
  "vite",
  "react",
  "astro",
  "express",
  "node",
  "static",
  "unknown",
] as const;
export const frameworkIdSchema = z.enum(FRAMEWORK_IDS);
export type FrameworkId = z.infer<typeof frameworkIdSchema>;

export const ARCHITECTURE_TYPES = [
  "static",
  "edge",
  "serverless",
  "node-server",
  "hybrid",
] as const;
export const architectureTypeSchema = z.enum(ARCHITECTURE_TYPES);
export type ArchitectureType = z.infer<typeof architectureTypeSchema>;

export const runtimeKindSchema = z.enum(["node", "static"]);
export type RuntimeKind = z.infer<typeof runtimeKindSchema>;

export const packageManagerSchema = z.enum(["npm", "pnpm", "yarn", "bun"]);
export type PackageManager = z.infer<typeof packageManagerSchema>;

export const databaseTypeSchema = z.enum(["postgres", "mysql", "sqlite", "mongodb", "redis"]);
export type DatabaseType = z.infer<typeof databaseTypeSchema>;

/**
 * Resultado determinístico da análise de um projeto.
 * schemaVersion permite evoluir o formato sem quebrar consumidores (CLI antiga
 * falando com API nova e vice-versa).
 */
export const projectAnalysisSchema = z.object({
  schemaVersion: z.literal(1),
  framework: frameworkIdSchema,
  frameworkVersion: z.string().nullable(),
  runtime: runtimeKindSchema,
  packageManager: packageManagerSchema.nullable(),
  buildCommand: z.string().nullable(),
  outputDir: z.string().nullable(),
  fileCount: z.number().int().nonnegative(),
  totalSizeBytes: z.number().int().nonnegative(),
  /** Percentual (0–100) do projeto que pode ser servido como conteúdo estático. */
  staticPercentage: z.number().min(0).max(100),
  requiresServer: z.boolean(),
  requiresDatabase: z.boolean(),
  databaseType: databaseTypeSchema.nullable(),
  backgroundJobs: z.boolean(),
  cronJobs: z.number().int().nonnegative(),
  apiRouteCount: z.number().int().nonnegative(),
  hasDockerfile: z.boolean(),
  /** Nomes de env vars referenciadas no código (nunca valores). */
  envVarsDetected: z.array(z.string()),
  dependencies: z.array(z.object({ name: z.string(), version: z.string() })),
  recommendedArchitecture: architectureTypeSchema,
  warnings: z.array(z.string()),
});
export type ProjectAnalysis = z.infer<typeof projectAnalysisSchema>;
