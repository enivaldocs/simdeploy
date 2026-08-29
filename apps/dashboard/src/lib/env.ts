import { z } from "zod";

/**
 * Env vars do servidor, validadas uma única vez. Falha cedo e com mensagem
 * clara se configuração obrigatória estiver ausente.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET precisa de pelo menos 32 caracteres"),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "ENCRYPTION_KEY deve ser 32 bytes em hex (64 chars)"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

let cached: z.infer<typeof envSchema> | null = null;

export function env(): z.infer<typeof envSchema> {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

export function isDev(): boolean {
  return env().NODE_ENV === "development";
}

export function githubOauthConfigured(): boolean {
  const e = env();
  return Boolean(e.GITHUB_CLIENT_ID && e.GITHUB_CLIENT_SECRET);
}

/** Billing completo (checkout + webhook assinado). */
export function stripeConfigured(): boolean {
  const e = env();
  return Boolean(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET);
}

/**
 * Checkout/portal exigem só a secret key. Sem webhook configurado, a
 * confirmação de pagamento chega pela reconciliação periódica
 * (job stripe_reconciliation) — mais lenta, mas o estado converge.
 */
export function stripeCheckoutAvailable(): boolean {
  return Boolean(env().STRIPE_SECRET_KEY);
}

export function adminEmails(): string[] {
  return (env().ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
