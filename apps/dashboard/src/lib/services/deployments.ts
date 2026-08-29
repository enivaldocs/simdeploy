import { statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { estimateCosts } from "@autocloud/cost-engine";
import { type Deployment, type Project, prisma } from "@autocloud/db";
import { NoRouteError, routeDeployment, runPipeline } from "@autocloud/deployment-engine";
import type {
  CreateDeploymentMeta,
  DeploymentResponse,
  DeploymentStatus,
  LogStage,
  RoutingDecision,
} from "@autocloud/shared";
import { routingDecisionSchema } from "@autocloud/shared";
import { trackEvent } from "../analytics";
import { audit } from "../audit";
import { artifactsDir } from "../paths";
import { loadPricingTables } from "./pricing";
import { providerRegistry } from "./providers";

export function toDeploymentResponse(deployment: Deployment): DeploymentResponse {
  const planParse = routingDecisionSchema.safeParse(deployment.plan);
  return {
    id: deployment.id,
    projectId: deployment.projectId,
    status: deployment.status,
    trigger: deployment.trigger,
    target: deployment.environmentId ? "production" : "production",
    url: deployment.url,
    branch: deployment.branch,
    commitSha: deployment.commitSha,
    commitMessage: deployment.commitMessage,
    plan: planParse.success ? planParse.data : null,
    error: deployment.error,
    durationMs: deployment.durationMs,
    createdAt: deployment.createdAt.toISOString(),
    finishedAt: deployment.finishedAt?.toISOString() ?? null,
  };
}

interface RunDeploymentInput {
  project: Project;
  meta: CreateDeploymentMeta;
  artifact: Buffer;
  userId: string;
}

/**
 * Cria e executa um deployment a partir de um artefato enviado pela CLI.
 *
 * O build do código do usuário acontece no CLIENTE (decisão de segurança do
 * MVP: código não confiável nunca roda no servidor da plataforma). Aqui o
 * pipeline valida o artefato, decide a rota (custo + compatibilidade) e
 * publica via provider adapter — registrando evento e log de cada etapa.
 */
export async function runDeployment(input: RunDeploymentInput): Promise<Deployment> {
  const { project, meta, artifact } = input;
  const startedAt = Date.now();

  const environment = await prisma.environment.findUnique({
    where: { projectId_name: { projectId: project.id, name: meta.target } },
  });

  const deployment = await prisma.deployment.create({
    data: {
      projectId: project.id,
      environmentId: environment?.id,
      status: "CREATED",
      trigger: meta.trigger,
      branch: meta.branch,
      commitSha: meta.commitSha,
      commitMessage: meta.commitMessage,
      analysis: meta.analysis as object,
    },
  });

  const artifactPath = join(artifactsDir(), `${deployment.id}.tar.gz`);
  writeFileSync(artifactPath, artifact);
  await prisma.deployment.update({
    where: { id: deployment.id },
    data: { artifactRef: artifactPath },
  });

  await audit({
    organizationId: project.organizationId,
    userId: input.userId,
    action: "deployment.create",
    resourceType: "deployment",
    resourceId: deployment.id,
    metadata: { projectId: project.id, trigger: meta.trigger },
  });
  await trackEvent({
    name: "deployment_started",
    userId: input.userId,
    organizationId: project.organizationId,
    properties: { deploymentId: deployment.id, framework: meta.analysis.framework },
  });

  const hooks = {
    onTransition: async (from: DeploymentStatus, to: DeploymentStatus, message?: string) => {
      await prisma.$transaction([
        prisma.deployment.update({ where: { id: deployment.id }, data: { status: to } }),
        prisma.deploymentEvent.create({
          data: { deploymentId: deployment.id, fromStatus: from, toStatus: to, message },
        }),
      ]);
    },
    log: async (
      stage: LogStage,
      level: "info" | "warn" | "error",
      message: string,
      metadata?: Record<string, unknown>,
    ) => {
      await prisma.logEntry.create({
        data: {
          deploymentId: deployment.id,
          stage,
          level,
          message,
          metadata: (metadata ?? undefined) as object | undefined,
        },
      });
    },
  };

  let decision: RoutingDecision | null = null;

  const result = await runPipeline(
    "CREATED",
    [
      {
        stage: "ANALYZE",
        enterStatus: "ANALYZING",
        failureStatus: "ANALYSIS_FAILED",
        execute: async () => {
          await hooks.log(
            "ANALYZE",
            "info",
            `Framework: ${meta.analysis.framework} — arquitetura recomendada: ${meta.analysis.recommendedArchitecture}`,
          );
          const tables = await loadPricingTables();
          const recommendation = estimateCosts(meta.analysis, { tables });
          const estimates = [recommendation.recommended, ...recommendation.alternatives];
          let routed: RoutingDecision;
          try {
            routed = routeDeployment({
              analysis: meta.analysis,
              estimates,
              availableProviders: providerRegistry().capabilities(),
              strategy: meta.strategy,
            });
          } catch (error) {
            if (error instanceof NoRouteError && meta.analysis.requiresServer) {
              throw new NoRouteError(
                `${error.message} Projetos com servidor (SSR/API) ainda dependem do provider cloud (em breve); um build 100% estático (ex.: output "export" no Next.js) já pode ser publicado.`,
              );
            }
            throw error;
          }
          decision = routed;
          await prisma.deployment.update({
            where: { id: deployment.id },
            data: { plan: routed as unknown as object },
          });
          await prisma.costEstimate.create({
            data: {
              projectId: project.id,
              deploymentId: deployment.id,
              provider: routed.provider,
              architecture: routed.architecture,
              monthlyUsd: routed.estimate.monthlyUsd.toString(),
              breakdown: routed.estimate.breakdown as unknown as object,
              assumptions: routed.estimate.assumptions as unknown as object,
            },
          });
          await hooks.log(
            "ANALYZE",
            "info",
            `Rota escolhida: ${routed.provider}/${routed.architecture} — custo estimado USD ${routed.estimate.monthlyUsd.toFixed(2)}/mês (projeção)`,
          );
        },
      },
      {
        stage: "QUEUE",
        enterStatus: "QUEUED",
        failureStatus: "CANCELED",
        execute: async () => {
          await hooks.log("QUEUE", "info", "Deployment na fila");
        },
      },
      {
        stage: "BUILD",
        enterStatus: "BUILDING",
        failureStatus: "BUILD_FAILED",
        execute: async () => {
          const size = statSync(artifactPath).size;
          if (size === 0) throw new Error("Artefato vazio recebido");
          await hooks.log(
            "BUILD",
            "info",
            `Artefato recebido do build no cliente (${(size / 1024).toFixed(1)} KB)`,
          );
        },
      },
      {
        stage: "DEPLOY",
        enterStatus: "DEPLOYING",
        failureStatus: "DEPLOY_FAILED",
        execute: async () => {
          const routed = decision;
          if (!routed) throw new Error("Pipeline sem decisão de rota");
          const provider = providerRegistry().get(routed.provider);
          const deployResult = await provider.deploy({
            projectSlug: project.slug,
            deploymentId: deployment.id,
            architecture: routed.architecture,
            artifactPath,
            env: {},
          });
          await prisma.deployment.update({
            where: { id: deployment.id },
            data: { url: deployResult.url },
          });
          await hooks.log("DEPLOY", "info", `Publicado em ${deployResult.url}`);
        },
      },
    ],
    hooks,
  );

  const durationMs = Date.now() - startedAt;
  await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      durationMs,
      finishedAt: new Date(),
      error: result.error,
    },
  });
  await prisma.project.update({
    where: { id: project.id },
    data: { framework: meta.analysis.framework },
  });

  await trackEvent({
    name: result.status === "READY" ? "deployment_completed" : "deployment_failed",
    userId: input.userId,
    organizationId: project.organizationId,
    properties: { deploymentId: deployment.id, status: result.status, durationMs },
  });

  const final = await prisma.deployment.findUniqueOrThrow({ where: { id: deployment.id } });
  return final;
}
