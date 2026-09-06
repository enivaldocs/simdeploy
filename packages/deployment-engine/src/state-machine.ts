import { type DeploymentStatus, TERMINAL_STATUSES } from "@simdeploy/shared";

/**
 * Máquina de estados do pipeline de deployment.
 *
 * CREATED → ANALYZING → QUEUED → BUILDING → DEPLOYING → READY
 * com falhas tipadas por etapa e cancelamento antes do deploy.
 */
const TRANSITIONS: Record<DeploymentStatus, readonly DeploymentStatus[]> = {
  CREATED: ["ANALYZING", "QUEUED", "CANCELED"],
  ANALYZING: ["QUEUED", "ANALYSIS_FAILED", "CANCELED"],
  QUEUED: ["BUILDING", "CANCELED"],
  BUILDING: ["UPLOADING", "DEPLOYING", "BUILD_FAILED", "CANCELED"],
  UPLOADING: ["DEPLOYING", "DEPLOY_FAILED", "CANCELED"],
  DEPLOYING: ["HEALTH_CHECK", "READY", "DEPLOY_FAILED"],
  HEALTH_CHECK: ["READY", "DEPLOY_FAILED"],
  READY: [],
  ANALYSIS_FAILED: [],
  BUILD_FAILED: [],
  DEPLOY_FAILED: [],
  CANCELED: [],
};

export function canTransition(from: DeploymentStatus, to: DeploymentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: DeploymentStatus,
    public readonly to: DeploymentStatus,
  ) {
    super(`Transição de deployment inválida: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: DeploymentStatus, to: DeploymentStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

export function isTerminal(status: DeploymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Rótulo simplificado para exibição (dashboard/CLI). */
export function displayStatus(
  status: DeploymentStatus,
): "Queued" | "Analyzing" | "Building" | "Deploying" | "Ready" | "Failed" | "Canceled" {
  switch (status) {
    case "CREATED":
    case "QUEUED":
      return "Queued";
    case "ANALYZING":
      return "Analyzing";
    case "BUILDING":
      return "Building";
    case "UPLOADING":
    case "DEPLOYING":
    case "HEALTH_CHECK":
      return "Deploying";
    case "READY":
      return "Ready";
    case "CANCELED":
      return "Canceled";
    case "ANALYSIS_FAILED":
    case "BUILD_FAILED":
    case "DEPLOY_FAILED":
      return "Failed";
  }
}
