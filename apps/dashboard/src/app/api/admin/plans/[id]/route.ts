import { prisma } from "@simdeploy/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { forbidden, handleApiError, notFound, ok, unauthorized } from "@/lib/api/respond";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { staffCanAccess } from "@/lib/auth/staff";

const planUpdateSchema = z.object({
  priceMonthlyMinor: z.number().int().nonnegative().optional(),
  priceAnnualMinor: z.number().int().nonnegative().nullable().optional(),
  limits: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

/** Edição de plano (config, não código) — auditada com before/after. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) throw unauthorized();
    if (!staffCanAccess(session.user.staffRole, "settings")) {
      throw forbidden("Requer papel ADMIN.");
    }
    const { id } = await params;
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw notFound("Plano");

    const body = planUpdateSchema.parse(await request.json());
    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...(body.priceMonthlyMinor !== undefined
          ? { priceMonthlyMinor: body.priceMonthlyMinor }
          : {}),
        ...(body.priceAnnualMinor !== undefined ? { priceAnnualMinor: body.priceAnnualMinor } : {}),
        ...(body.limits !== undefined ? { limits: body.limits as object } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        // Preço mudou → price antigo do Stripe não vale mais; o próximo
        // checkout auto-provisiona um novo price.
        ...(body.priceMonthlyMinor !== undefined &&
        body.priceMonthlyMinor !== plan.priceMonthlyMinor
          ? { stripePriceMonthlyId: null }
          : {}),
        ...(body.priceAnnualMinor !== undefined && body.priceAnnualMinor !== plan.priceAnnualMinor
          ? { stripePriceAnnualId: null }
          : {}),
      },
    });

    await audit({
      userId: session.user.id,
      action: "admin.plan_update",
      resourceType: "plan",
      resourceId: plan.id,
      before: {
        priceMonthlyMinor: plan.priceMonthlyMinor,
        priceAnnualMinor: plan.priceAnnualMinor,
        limits: plan.limits,
        active: plan.active,
      },
      after: {
        priceMonthlyMinor: updated.priceMonthlyMinor,
        priceAnnualMinor: updated.priceAnnualMinor,
        limits: updated.limits,
        active: updated.active,
      },
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return ok({ plan: { id: updated.id, slug: updated.slug } });
  } catch (error) {
    return handleApiError(error);
  }
}
