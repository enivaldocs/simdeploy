import type { DeploymentStatus } from "@autocloud/shared";
import { describe, expect, it } from "vitest";
import { type PipelineHooks, type PipelineStage, runPipeline } from "../src/pipeline.js";

function recorder() {
  const transitions: Array<{ from: DeploymentStatus; to: DeploymentStatus }> = [];
  const logs: string[] = [];
  const hooks: PipelineHooks = {
    onTransition: async (from, to) => {
      transitions.push({ from, to });
    },
    log: async (_stage, _level, message) => {
      logs.push(message);
    },
  };
  return { transitions, logs, hooks };
}

const buildStage = (execute: () => Promise<void>): PipelineStage => ({
  stage: "BUILD",
  enterStatus: "BUILDING",
  failureStatus: "BUILD_FAILED",
  execute,
});

const deployStage = (execute: () => Promise<void>): PipelineStage => ({
  stage: "DEPLOY",
  enterStatus: "DEPLOYING",
  failureStatus: "DEPLOY_FAILED",
  execute,
});

describe("runPipeline", () => {
  it("percorre QUEUED → BUILDING → DEPLOYING → READY no sucesso", async () => {
    const { transitions, hooks } = recorder();
    const result = await runPipeline(
      "QUEUED",
      [buildStage(async () => {}), deployStage(async () => {})],
      hooks,
    );
    expect(result.status).toBe("READY");
    expect(result.error).toBeNull();
    expect(transitions.map((t) => t.to)).toEqual(["BUILDING", "DEPLOYING", "READY"]);
  });

  it("falha de build termina em BUILD_FAILED com log e sem deploy", async () => {
    const { transitions, logs, hooks } = recorder();
    let deployed = false;
    const result = await runPipeline(
      "QUEUED",
      [
        buildStage(async () => {
          throw new Error("Module not found: ./missing");
        }),
        deployStage(async () => {
          deployed = true;
        }),
      ],
      hooks,
    );
    expect(result.status).toBe("BUILD_FAILED");
    expect(result.error).toContain("Module not found");
    expect(deployed).toBe(false);
    expect(logs.some((l) => l.includes("Module not found"))).toBe(true);
    expect(transitions.at(-1)?.to).toBe("BUILD_FAILED");
  });

  it("falha de deploy termina em DEPLOY_FAILED", async () => {
    const { hooks } = recorder();
    const result = await runPipeline(
      "QUEUED",
      [
        buildStage(async () => {}),
        deployStage(async () => {
          throw new Error("provider unreachable");
        }),
      ],
      hooks,
    );
    expect(result.status).toBe("DEPLOY_FAILED");
  });
});
