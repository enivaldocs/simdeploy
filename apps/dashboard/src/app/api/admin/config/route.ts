import type { NextRequest } from "next/server";
import { z } from "zod";
import { setConfig } from "@/lib/admin/config";
import { forbidden, handleApiError, ok, unauthorized } from "@/lib/api/respond";
import { getSession } from "@/lib/auth/session";
import { staffCanAccess } from "@/lib/auth/staff";

const ALLOWED_KEYS = new Set(["fx_rate_usd_brl", "feature_flags", "reserved_domains"]);

const configSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

/** Escrita de configuração operacional — ADMIN/SUPER_ADMIN, sempre auditada. */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw unauthorized();
    if (!staffCanAccess(session.user.staffRole, "settings")) {
      throw forbidden("Requer papel ADMIN.");
    }
    const body = configSchema.parse(await request.json());
    if (!ALLOWED_KEYS.has(body.key)) {
      throw forbidden(`Chave de configuração não permitida: ${body.key}`);
    }
    await setConfig(body.key, body.value, {
      userId: session.user.id,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return ok({ saved: true, key: body.key });
  } catch (error) {
    return handleApiError(error);
  }
}
