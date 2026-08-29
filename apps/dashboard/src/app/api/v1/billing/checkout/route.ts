import type { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/api/auth";
import { apiError, forbidden, handleApiError, ok } from "@/lib/api/respond";
import { createCheckoutSession } from "@/lib/billing/service";
import { stripeConfigured } from "@/lib/env";

const checkoutSchema = z.object({
  planSlug: z.string().min(1).max(50),
  interval: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    // Upgrade de plano é decisão humana — exige sessão de dashboard.
    if (auth.kind !== "session") throw forbidden("Checkout é feito pelo dashboard.");
    if (!stripeConfigured()) {
      return apiError(
        501,
        "stripe_not_configured",
        "Pagamento online indisponível neste ambiente.",
      );
    }
    const body = checkoutSchema.parse(await request.json());
    const { url } = await createCheckoutSession({
      organization: auth.organization,
      userId: auth.user.id,
      email: auth.user.email,
      planSlug: body.planSlug,
      interval: body.interval,
    });
    return ok({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
