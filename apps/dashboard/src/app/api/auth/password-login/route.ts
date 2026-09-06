import { type NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { authenticateWithPassword } from "@/lib/auth/users";
import { env } from "@/lib/env";
import { rateLimiters } from "@/lib/rate-limit";

/** Login com e-mail e senha. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const appUrl = env().APP_URL;
  const limit = rateLimiters().auth.limit(
    `password-login:${request.headers.get("x-forwarded-for") ?? "local"}`,
  );
  if (!limit.allowed) {
    return NextResponse.redirect(`${appUrl}/login?error=rate_limited`, 303);
  }

  const form = await request.formData().catch(() => null);
  const email = String(form?.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form?.get("password") ?? "");
  if (!email || !password) {
    return NextResponse.redirect(`${appUrl}/login?error=bad_credentials`, 303);
  }

  const user = await authenticateWithPassword(email, password);
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login?error=bad_credentials`, 303);
  }
  await createSession(user.id);
  return NextResponse.redirect(`${appUrl}/dashboard`, 303);
}
