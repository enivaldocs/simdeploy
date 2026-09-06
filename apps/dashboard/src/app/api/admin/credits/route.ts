import { prisma } from "@simdeploy/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { forbidden, handleApiError, notFound, ok, unauthorized } from "@/lib/api/respond";
import { getSession } from "@/lib/auth/session";
import { staffCanAccess } from "@/lib/auth/staff";
import { addLedgerEntry } from "@/lib/billing/ledger";

const manualCreditSchema = z.object({
  organizationId: z.string().min(1),
  amountMinor: z
    .number()
    .int()
    .refine((v) => v !== 0, "Valor não pode ser zero"),
  reason: z.string().min(3).max(500),
});

/** Entrada MANUAL no ledger — exige papel de finance/admin; sempre auditada. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw unauthorized();
    if (!staffCanAccess(session.user.staffRole, "finance")) {
      throw forbidden("Requer papel FINANCE/ADMIN.");
    }
    const body = manualCreditSchema.parse(await request.json());
    const org = await prisma.organization.findUnique({ where: { id: body.organizationId } });
    if (!org) throw notFound("Organização");

    await addLedgerEntry({
      organizationId: org.id,
      amountMinor: body.amountMinor,
      type: "MANUAL",
      reason: body.reason,
      source: `admin:${session.user.id}`,
      actorUserId: session.user.id,
    });
    return ok({ saved: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
