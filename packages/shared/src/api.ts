import { z } from "zod";
import { projectAnalysisSchema } from "./types/analysis.js";
import { expectedUsageSchema } from "./types/cost.js";
import {
  deploymentStatusSchema,
  deploymentTriggerSchema,
  routingDecisionSchema,
  routingStrategySchema,
} from "./types/deployment.js";
import { tokenScopeSchema } from "./types/tokens.js";

/**
 * Contratos da API v1, compartilhados entre servidor (validação de input) e
 * CLI/MCP (tipagem de respostas). Toda rota valida input com estes schemas.
 */

export const projectNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/, "Nome de projeto contém caracteres inválidos");

export const slugSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Slug inválido");

export const createProjectRequestSchema = z.object({
  name: projectNameSchema,
  gitRepoUrl: z.url().max(500).optional(),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

export const projectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  framework: z.string().nullable(),
  gitRepoUrl: z.string().nullable(),
  defaultDomain: z.string().nullable(),
  latestDeployment: z
    .object({
      id: z.string(),
      status: deploymentStatusSchema,
      createdAt: z.string(),
      url: z.string().nullable(),
    })
    .nullable(),
  estimatedMonthlyUsd: z.number().nullable(),
  createdAt: z.string(),
});
export type ProjectResponse = z.infer<typeof projectResponseSchema>;

export const analyzeProjectRequestSchema = z.object({
  analysis: projectAnalysisSchema,
  usage: expectedUsageSchema.partial().optional(),
  strategy: routingStrategySchema.optional(),
});
export type AnalyzeProjectRequest = z.infer<typeof analyzeProjectRequestSchema>;

export const costEstimateRequestSchema = z.object({
  analysis: projectAnalysisSchema,
  usage: expectedUsageSchema.partial().optional(),
});
export type CostEstimateRequest = z.infer<typeof costEstimateRequestSchema>;

/**
 * Metadados enviados junto com o artefato no POST multipart de deployment.
 * O artefato (tar.gz dos arquivos já buildados no cliente) vai no campo
 * "artifact" do form.
 */
export const createDeploymentMetaSchema = z.object({
  analysis: projectAnalysisSchema,
  trigger: deploymentTriggerSchema.default("cli"),
  strategy: routingStrategySchema.default("CHEAPEST"),
  target: z.enum(["production", "preview"]).default("production"),
  commitSha: z.string().max(64).optional(),
  commitMessage: z.string().max(500).optional(),
  branch: z.string().max(200).optional(),
});
export type CreateDeploymentMeta = z.infer<typeof createDeploymentMetaSchema>;

export const deploymentResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: deploymentStatusSchema,
  trigger: deploymentTriggerSchema,
  target: z.string(),
  url: z.string().nullable(),
  branch: z.string().nullable(),
  commitSha: z.string().nullable(),
  commitMessage: z.string().nullable(),
  plan: routingDecisionSchema.nullable(),
  error: z.string().nullable(),
  durationMs: z.number().nullable(),
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
});
export type DeploymentResponse = z.infer<typeof deploymentResponseSchema>;

export const setEnvVarRequestSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Nome de variável inválido"),
  value: z.string().max(32_768),
  target: z.enum(["production", "preview", "all"]).default("all"),
});
export type SetEnvVarRequest = z.infer<typeof setEnvVarRequestSchema>;

export const createTokenRequestSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(tokenScopeSchema).min(1),
  expiresInDays: z.number().int().positive().max(365).optional(),
});
export type CreateTokenRequest = z.infer<typeof createTokenRequestSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
