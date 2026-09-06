/**
 * Cria o webhook endpoint do Stripe para ESTA instalação e grava o signing
 * secret no .env. Cada instalação tem o PRÓPRIO endpoint + PRÓPRIO whsec —
 * nunca reusar de outro site (assinatura é por endpoint).
 * Rodar NA VPS: node deploy/setup-stripe-webhook.mjs /opt/simdeploy/.env
 * Idempotente: se já existe endpoint para esta URL, reusa/avisa.
 */
import { readFileSync, writeFileSync } from "node:fs";

const envPath = process.argv[2] ?? "/opt/simdeploy/.env";
const env = readFileSync(envPath, "utf8");
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();

const sk = get("STRIPE_SECRET_KEY");
const appUrl = get("APP_URL");
if (!sk || !appUrl) {
  console.error("STRIPE_SECRET_KEY/APP_URL ausentes no env");
  process.exit(1);
}
const webhookUrl = `${appUrl}/api/webhooks/stripe`;

const EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
];

async function stripe(path, params) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${sk}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? `HTTP ${response.status}`);
  return body;
}

if (get("STRIPE_WEBHOOK_SECRET")) {
  console.error("STRIPE_WEBHOOK_SECRET já configurado — nada a fazer.");
  process.exit(0);
}

const existing = await stripe("webhook_endpoints?limit=100");
const duplicate = existing.data.find((endpoint) => endpoint.url === webhookUrl);
if (duplicate) {
  console.error(
    `Endpoint já existe (${duplicate.id}) mas o secret só é revelado na criação. ` +
      "Apague-o no dashboard do Stripe e rode de novo, ou cole o secret manualmente.",
  );
  process.exit(1);
}

const params = new URLSearchParams({ url: webhookUrl });
for (const [index, event] of EVENTS.entries()) {
  params.append(`enabled_events[${index}]`, event);
}
const endpoint = await stripe("webhook_endpoints", params);

writeFileSync(envPath, `${env.trimEnd()}\nSTRIPE_WEBHOOK_SECRET=${endpoint.secret}\n`);
console.error(`Webhook criado: ${endpoint.id} -> ${webhookUrl}`);
console.error(`Secret gravado no env (whsec_...${endpoint.secret.slice(-4)})`);
