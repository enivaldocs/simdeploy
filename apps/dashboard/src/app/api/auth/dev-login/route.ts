import { type NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/respond";
import { createSession } from "@/lib/auth/session";
import { upsertUserWithPersonalOrg } from "@/lib/auth/users";
import { env, isDev } from "@/lib/env";

/**
 * Login de desenvolvimento — habilitado APENAS com NODE_ENV=development.
 * Permite usar o dashboard e a CLI localmente sem configurar OAuth.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isDev()) {
    return apiError(404, "not_found", "Não disponível.");
  }
  const form = await request.formData().catch(() => null);
  const email = String(form?.get("email") ?? "dev@autocloud.local");

  const user = await upsertUserWithPersonalOrg({ email, name: "Dev User" });
  await createSession(user.id);
  return NextResponse.redirect(`${env().APP_URL}/dashboard`, 303);
}
