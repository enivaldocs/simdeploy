import { prisma } from "@simdeploy/db";
import { logger } from "@simdeploy/shared/logger";

/**
 * NotificationService desacoplado: eventos de negócio geram registros na
 * tabela Notification (canal in_app). O envio de email é um adapter plugável
 * — quando um EmailProvider for configurado, o job de entrega processa os
 * registros pending do canal email. Lógica de negócio nunca conhece o
 * provider de email.
 */
export interface NotifyInput {
  organizationId?: string;
  userId?: string;
  type:
    | "welcome"
    | "first_deploy"
    | "deploy_failed"
    | "payment_failed"
    | "payment_recovered"
    | "usage_80"
    | "usage_100"
    | "credits_low"
    | "subscription_canceled"
    | "provider_incident";
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        channel: "in_app",
        status: "sent",
        sentAt: new Date(),
        metadata: (input.metadata ?? undefined) as object | undefined,
      },
    });
  } catch (error) {
    // Notificação nunca derruba o fluxo principal.
    logger.warn("notification_failed", {
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
