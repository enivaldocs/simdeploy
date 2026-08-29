import { prisma } from "@autocloud/db";
import { logger } from "@autocloud/shared/logger";

export interface AuditInput {
  organizationId?: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/** Registro de auditoria — toda mutação relevante passa por aqui. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: (input.metadata ?? undefined) as object | undefined,
      },
    });
  } catch (error) {
    logger.error("audit_write_failed", {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
