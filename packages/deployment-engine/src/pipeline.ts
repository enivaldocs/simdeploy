import type { DeploymentStatus, LogStage } from "@autocloud/shared";
import { assertTransition } from "./state-machine.js";

export interface PipelineStage {
  /** Estágio de log correspondente (BUILD, DEPLOY, ...). */
  stage: LogStage;
  /** Status assumido enquanto o estágio roda. */
  enterStatus: DeploymentStatus;
  /** Status terminal em caso de falha deste estágio. */
  failureStatus: DeploymentStatus;
  execute(): Promise<void>;
}

export interface PipelineHooks {
  /** Persistir transição de status (banco + DeploymentEvent). */
  onTransition(from: DeploymentStatus, to: DeploymentStatus, message?: string): Promise<void>;
  /** Persistir linha de log do pipeline. */
  log(
    stage: LogStage,
    level: "info" | "warn" | "error",
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}

export interface PipelineResult {
  status: DeploymentStatus;
  error: string | null;
}

/**
 * Executa os estágios de um deployment respeitando a máquina de estados.
 * Cada transição é validada e persistida via hooks; a falha de um estágio
 * leva ao status de falha tipado daquele estágio e encerra o pipeline.
 */
export async function runPipeline(
  initialStatus: DeploymentStatus,
  stages: PipelineStage[],
  hooks: PipelineHooks,
): Promise<PipelineResult> {
  let current = initialStatus;

  for (const stage of stages) {
    assertTransition(current, stage.enterStatus);
    await hooks.onTransition(current, stage.enterStatus);
    current = stage.enterStatus;

    try {
      await stage.execute();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await hooks.log(stage.stage, "error", message);
      assertTransition(current, stage.failureStatus);
      await hooks.onTransition(current, stage.failureStatus, message);
      return { status: stage.failureStatus, error: message };
    }
  }

  assertTransition(current, "READY");
  await hooks.onTransition(current, "READY");
  return { status: "READY", error: null };
}
