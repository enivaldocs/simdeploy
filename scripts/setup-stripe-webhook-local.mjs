#!/usr/bin/env node
/**
 * Configura o STRIPE_WEBHOOK_SECRET para desenvolvimento local.
 *
 * Cada endpoint de webhook tem o PRÓPRIO signing secret — nunca reusar o de
 * outro site (lição documentada em docs/stripe.md). Em dev, o endpoint é o
 * túnel do Stripe CLI: este script obtém o secret da sessão `stripe listen`
 * e grava no .env. Rode `stripe listen --forward-to
 * localhost:3000/api/webhooks/stripe` em outro terminal para receber eventos.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const env = readFileSync(envPath, "utf8");

const skMatch = env.match(/^STRIPE_SECRET_KEY=(.+)$/m);
if (!skMatch) {
  console.error("STRIPE_SECRET_KEY ausente no .env");
  process.exit(1);
}

const secret = execFileSync("stripe", ["listen", "--print-secret"], {
  env: { ...process.env, STRIPE_API_KEY: skMatch[1].trim() },
  encoding: "utf8",
}).trim();

if (!secret.startsWith("whsec_")) {
  console.error("Stripe CLI não retornou um whsec válido");
  process.exit(1);
}

const updated = env.match(/^STRIPE_WEBHOOK_SECRET=/m)
  ? env.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, `STRIPE_WEBHOOK_SECRET=${secret}`)
  : `${env.trimEnd()}\nSTRIPE_WEBHOOK_SECRET=${secret}\n`;
writeFileSync(envPath, updated);
console.log(`STRIPE_WEBHOOK_SECRET gravado no .env (whsec_...${secret.slice(-4)})`);
