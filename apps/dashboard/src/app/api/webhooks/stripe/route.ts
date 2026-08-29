import type { NextRequest } from "next/server";
import { apiError, ok } from "@/lib/api/respond";
import { handleStripeWebhook } from "@/lib/billing/webhook";
import { stripeConfigured } from "@/lib/env";

/**
 * Webhook Stripe. Assinatura inválida → 400 (não reenvia). Falha de
 * processamento → 500 (Stripe reenvia; nosso dedup/attempts registra).
 * Nunca confiar no frontend: TODA confirmação de pagamento entra por aqui.
 */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) {
    return apiError(501, "stripe_not_configured", "Stripe não configurado neste ambiente.");
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return apiError(400, "missing_signature", "Header stripe-signature ausente.");
  }
  const rawBody = await request.text();

  try {
    const result = await handleStripeWebhook(rawBody, signature);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/signature|timestamp/i.test(message)) {
      return apiError(400, "invalid_signature", "Assinatura do webhook inválida.");
    }
    return apiError(500, "webhook_processing_failed", message);
  }
}
