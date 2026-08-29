import Stripe from "stripe";
import { env } from "../env";

/**
 * Cliente Stripe singleton. Nunca importar em código de client — server-only.
 * Retorna null quando o ambiente não tem STRIPE_SECRET_KEY (billing offline).
 */
const globalStore = globalThis as unknown as { acStripe?: Stripe | null };

export function getStripe(): Stripe | null {
  if (globalStore.acStripe !== undefined) return globalStore.acStripe;
  const key = env().STRIPE_SECRET_KEY;
  globalStore.acStripe = key ? new Stripe(key, { typescript: true }) : null;
  return globalStore.acStripe;
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe não configurado neste ambiente (STRIPE_SECRET_KEY ausente).");
  }
  return stripe;
}
