import { estimateCosts } from "@simdeploy/cost-engine";
import { costEstimateRequestSchema } from "@simdeploy/shared";
import type { NextRequest } from "next/server";
import { trackEvent } from "@/lib/analytics";
import { authenticateApi, requireScope } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/respond";
import { loadPricingTables } from "@/lib/services/pricing";

/** Estimativa de custo standalone (Cloud Cost Scanner) — não exige projeto. */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    requireScope(auth, "cost:read");
    const body = costEstimateRequestSchema.parse(await request.json());
    const tables = await loadPricingTables();
    const recommendation = estimateCosts(body.analysis, { tables, usage: body.usage });
    await trackEvent({
      name: "cost_estimate_generated",
      userId: auth.user.id,
      organizationId: auth.organization.id,
      properties: { framework: body.analysis.framework, standalone: true },
    });
    return ok({ recommendation });
  } catch (error) {
    return handleApiError(error);
  }
}
