import { logger } from "@simdeploy/shared/logger";
import { env } from "./env";

/**
 * Alertas para o DONO da plataforma (não para o cliente) — nova conta, novo
 * deploy, primeira venda. Canal: Telegram se TELEGRAM_BOT_TOKEN + CHAT_ID
 * estiverem configurados; caso contrário só loga. Nunca derruba o fluxo.
 */
export type AdminAlertKind = "signup" | "first_deploy" | "subscription" | "payment";

const EMOJI_FREE_LABEL: Record<AdminAlertKind, string> = {
  signup: "New signup",
  first_deploy: "New deploy",
  subscription: "New subscription",
  payment: "Payment received",
};

export async function adminAlert(kind: AdminAlertKind, lines: string[]): Promise<void> {
  const e = env();
  const token = e.TELEGRAM_BOT_TOKEN;
  const chatId = e.TELEGRAM_CHAT_ID;
  const text = [`SimDeploy — ${EMOJI_FREE_LABEL[kind]}`, ...lines].join("\n");

  if (!token || !chatId) {
    logger.info("admin_alert", { kind, text });
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
  } catch (error) {
    logger.warn("admin_alert_failed", {
      kind,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
