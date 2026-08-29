import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  displayStatus,
  InvalidTransitionError,
  isTerminal,
} from "../src/state-machine.js";

describe("state machine", () => {
  it("aceita o caminho feliz completo", () => {
    expect(canTransition("CREATED", "ANALYZING")).toBe(true);
    expect(canTransition("ANALYZING", "QUEUED")).toBe(true);
    expect(canTransition("QUEUED", "BUILDING")).toBe(true);
    expect(canTransition("BUILDING", "UPLOADING")).toBe(true);
    expect(canTransition("UPLOADING", "DEPLOYING")).toBe(true);
    expect(canTransition("DEPLOYING", "HEALTH_CHECK")).toBe(true);
    expect(canTransition("HEALTH_CHECK", "READY")).toBe(true);
  });

  it("mantém caminho curto sem upload/health (retrocompatível)", () => {
    expect(canTransition("BUILDING", "DEPLOYING")).toBe(true);
    expect(canTransition("DEPLOYING", "READY")).toBe(true);
  });

  it("upload e health check falham para DEPLOY_FAILED", () => {
    expect(canTransition("UPLOADING", "DEPLOY_FAILED")).toBe(true);
    expect(canTransition("HEALTH_CHECK", "DEPLOY_FAILED")).toBe(true);
    expect(canTransition("HEALTH_CHECK", "BUILDING")).toBe(false);
  });

  it("aceita atalho CREATED → QUEUED (análise feita no cliente)", () => {
    expect(canTransition("CREATED", "QUEUED")).toBe(true);
  });

  it("cada etapa falha para o status tipado correspondente", () => {
    expect(canTransition("ANALYZING", "ANALYSIS_FAILED")).toBe(true);
    expect(canTransition("BUILDING", "BUILD_FAILED")).toBe(true);
    expect(canTransition("DEPLOYING", "DEPLOY_FAILED")).toBe(true);
  });

  it("rejeita transições inválidas", () => {
    expect(canTransition("CREATED", "READY")).toBe(false);
    expect(canTransition("READY", "BUILDING")).toBe(false);
    expect(canTransition("BUILDING", "ANALYSIS_FAILED")).toBe(false);
    expect(canTransition("DEPLOYING", "CANCELED")).toBe(false);
    expect(() => assertTransition("CREATED", "READY")).toThrow(InvalidTransitionError);
  });

  it("estados terminais não transicionam", () => {
    for (const status of [
      "READY",
      "ANALYSIS_FAILED",
      "BUILD_FAILED",
      "DEPLOY_FAILED",
      "CANCELED",
    ] as const) {
      expect(isTerminal(status)).toBe(true);
      expect(canTransition(status, "QUEUED")).toBe(false);
    }
  });

  it("mapeia status para rótulos de exibição", () => {
    expect(displayStatus("CREATED")).toBe("Queued");
    expect(displayStatus("BUILD_FAILED")).toBe("Failed");
    expect(displayStatus("READY")).toBe("Ready");
    expect(displayStatus("UPLOADING")).toBe("Deploying");
    expect(displayStatus("HEALTH_CHECK")).toBe("Deploying");
  });
});
