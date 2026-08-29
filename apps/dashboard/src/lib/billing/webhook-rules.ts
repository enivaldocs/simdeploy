/**
 * Regras de idempotência de webhook — módulo PURO para teste isolado.
 */
export type WebhookStatusName = "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "SKIPPED";

/**
 * Decide se um evento deve ser (re)processado:
 * - inexistente → process (evento novo)
 * - PROCESSED/SKIPPED → skip (idempotência: nunca reprocessa)
 * - RECEIVED/PROCESSING (crash anterior)/FAILED → process (retry)
 */
export function shouldProcessWebhook(
  existing: { status: WebhookStatusName } | null,
): "process" | "skip" {
  if (!existing) return "process";
  if (existing.status === "PROCESSED" || existing.status === "SKIPPED") return "skip";
  return "process";
}
