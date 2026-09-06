import { type CreditEntryType, prisma } from "@simdeploy/db";
import { balanceOf } from "@simdeploy/finance";
import { audit } from "../audit";

/**
 * Carteira de créditos: apenas ENTRADAS imutáveis no ledger. Saldo sempre
 * derivado. Toda entrada manual exige ator e é auditada.
 */
export async function addLedgerEntry(input: {
  organizationId: string;
  amountMinor: number;
  currency?: string;
  type: CreditEntryType;
  reason: string;
  source?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor === 0) {
    throw new Error("Entrada de ledger exige valor inteiro (minor units) diferente de zero");
  }
  await prisma.creditLedgerEntry.create({
    data: {
      organizationId: input.organizationId,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "BRL",
      type: input.type,
      reason: input.reason,
      source: input.source,
      actorUserId: input.actorUserId,
      metadata: (input.metadata ?? undefined) as object | undefined,
    },
  });
  if (input.type === "MANUAL" || input.type === "REVERSAL") {
    await audit({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: "credits.manual_entry",
      resourceType: "credit_ledger",
      metadata: { amountMinor: input.amountMinor, type: input.type, reason: input.reason },
    });
  }
}

export async function getCreditBalance(organizationId: string, currency = "BRL"): Promise<number> {
  const entries = await prisma.creditLedgerEntry.findMany({
    where: { organizationId },
    select: { amountMinor: true, currency: true },
  });
  return balanceOf(entries, currency);
}
