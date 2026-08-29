import type { NextRequest } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { apiError, forbidden, handleApiError, ok } from "@/lib/api/respond";
import { createPortalSession } from "@/lib/billing/service";
import { stripeConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    if (auth.kind !== "session") throw forbidden("Portal de billing é acessado pelo dashboard.");
    if (!stripeConfigured()) {
      return apiError(
        501,
        "stripe_not_configured",
        "Pagamento online indisponível neste ambiente.",
      );
    }
    const { url } = await createPortalSession(auth.organization);
    return ok({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
