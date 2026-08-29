import { z } from "zod";
import { architectureTypeSchema } from "./analysis.js";
import { architectureCostEstimateSchema } from "./cost.js";

export const DEPLOYMENT_STATUSES = [
  "CREATED",
  "ANALYZING",
  "QUEUED",
  "BUILDING",
  "UPLOADING",
  "DEPLOYING",
  "HEALTH_CHECK",
  "READY",
  "ANALYSIS_FAILED",
  "BUILD_FAILED",
  "DEPLOY_FAILED",
  "CANCELED",
] as const;
export const deploymentStatusSchema = z.enum(DEPLOYMENT_STATUSES);
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;

export const TERMINAL_STATUSES: readonly DeploymentStatus[] = [
  "READY",
  "ANALYSIS_FAILED",
  "BUILD_FAILED",
  "DEPLOY_FAILED",
  "CANCELED",
];

export const FAILED_STATUSES: readonly DeploymentStatus[] = [
  "ANALYSIS_FAILED",
  "BUILD_FAILED",
  "DEPLOY_FAILED",
];

export const deploymentTriggerSchema = z.enum(["cli", "api", "dashboard", "git"]);
export type DeploymentTrigger = z.infer<typeof deploymentTriggerSchema>;

export const LOG_STAGES = [
  "ANALYZE",
  "QUEUE",
  "BUILD",
  "UPLOAD",
  "DEPLOY",
  "HEALTH",
  "SYSTEM",
] as const;
export const logStageSchema = z.enum(LOG_STAGES);
export type LogStage = z.infer<typeof logStageSchema>;

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const deploymentLogSchema = z.object({
  timestamp: z.string(),
  deploymentId: z.string(),
  stage: logStageSchema,
  level: logLevelSchema,
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type DeploymentLog = z.infer<typeof deploymentLogSchema>;

export const ROUTING_STRATEGIES = ["CHEAPEST", "BALANCED", "PERFORMANCE"] as const;
export const routingStrategySchema = z.enum(ROUTING_STRATEGIES);
export type RoutingStrategy = z.infer<typeof routingStrategySchema>;

/** Decisão do AICloudRouter: onde e como o deployment roda. */
export const routingDecisionSchema = z.object({
  provider: z.string(),
  architecture: architectureTypeSchema,
  region: z.string(),
  strategy: routingStrategySchema,
  resources: z.object({
    memoryMb: z.number().positive(),
    timeoutSec: z.number().positive(),
  }),
  estimate: architectureCostEstimateSchema,
  /** Justificativas legíveis da escolha (compatibilidade, custo, etc.). */
  reasons: z.array(z.string()),
});
export type RoutingDecision = z.infer<typeof routingDecisionSchema>;
