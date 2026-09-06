import type { ArchitectureType, FrameworkId } from "@simdeploy/shared";

export interface ArchitectureInput {
  framework: FrameworkId;
  requiresServer: boolean;
  apiRouteCount: number;
  staticPercentage: number;
  backgroundJobs: boolean;
  hasDockerfile: boolean;
}

/**
 * Regras determinísticas de recomendação de arquitetura.
 * Ordem importa: da restrição mais forte para a mais fraca.
 *
 * 1. Dockerfile → node-server (containers virão depois; VM/runtime dedicado)
 * 2. Background jobs → node-server (precisa de processo persistente)
 * 3. Sem servidor + sem API → static
 * 4. Sem servidor + API routes → hybrid (static + serverless functions)
 * 5. Com servidor, framework serverless-friendly (Next/Astro):
 *    - muito conteúdo estático → hybrid
 *    - pouco conteúdo estático → serverless
 * 6. Servidores puros (Express/Node) → node-server
 */
export function recommendArchitecture(input: ArchitectureInput): ArchitectureType {
  if (input.hasDockerfile) return "node-server";
  if (input.backgroundJobs) return "node-server";

  if (!input.requiresServer) {
    return input.apiRouteCount > 0 ? "hybrid" : "static";
  }

  if (input.framework === "nextjs" || input.framework === "astro") {
    return input.staticPercentage >= 60 ? "hybrid" : "serverless";
  }

  return "node-server";
}
