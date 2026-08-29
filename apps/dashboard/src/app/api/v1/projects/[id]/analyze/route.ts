import { estimateCosts } from "@autocloud/cost-engine";
import { prisma } from "@autocloud/db";
import { NoRouteError, routeDeployment } from "@autocloud/deployment-engine";
import { analyzeProjectRequestSchema } from "@autocloud/shared";
import type { NextRequest } from "next/server";
import { trackEvent } from "@/lib/analytics";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, notFound, ok } from "@/lib/api/respond";
import { loadPricingTables } from "@/lib/services/pricing";
import { providerRegistry } from "@/lib/services/providers";

type Params = { params: Promise<{ id: string }> };

/**
 * Registra a análise de um projeto (enviada pela CLI) e devolve a projeção de
 * custo + rota que o deploy usaria — sem publicar nada.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "projects:write");
    requireScope(auth, "cost:read");
    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
    if (!project) throw notFound("Projeto");

    const body = analyzeProjectRequestSchema.parse(await request.json());
    const tables = await loadPricingTables();
    const recommendation = estimateCosts(body.analysis, { tables, usage: body.usage });

    let plannedRoute = null;
    try {
      plannedRoute = routeDeployment({
        analysis: body.analysis,
        estimates: [recommendation.recommended, ...recommendation.alternatives],
        availableProviders: providerRegistry().capabilities(),
        strategy: body.strategy,
      });
    } catch (error) {
      if (!(error instanceof NoRouteError)) throw error;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { framework: body.analysis.framework },
    });
    await prisma.costEstimate.create({
      data: {
        projectId: project.id,
        provider: recommendation.recommended.provider,
        architecture: recommendation.recommended.architecture,
        monthlyUsd: recommendation.recommended.monthlyUsd.toString(),
        breakdown: recommendation.recommended.breakdown as unknown as object,
        assumptions: recommendation.recommended.assumptions as unknown as object,
      },
    });
    await trackEvent({
      name: "project_analyzed",
      userId: auth.user.id,
      organizationId: auth.organization.id,
      properties: { projectId: project.id, framework: body.analysis.framework },
    });
    await trackEvent({
      name: "cost_estimate_generated",
      userId: auth.user.id,
      organizationId: auth.organization.id,
      properties: { projectId: project.id, monthlyUsd: recommendation.recommended.monthlyUsd },
    });

    return ok({ recommendation, plannedRoute });
  } catch (error) {
    return handleApiError(error);
  }
}
