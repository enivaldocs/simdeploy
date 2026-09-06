import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readAcquisitionCookie } from "@/lib/auth/acquisition";
import { createSession } from "@/lib/auth/session";
import { EmailTakenError, registerWithPassword } from "@/lib/auth/users";
import { env } from "@/lib/env";
import { rateLimiters } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().max(100).optional(),
});

/** Cadastro com e-mail e senha; cria sessão e leva ao dashboard. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const appUrl = env().APP_URL;
  const limit = rateLimiters().auth.limit(
    `register:${request.headers.get("x-forwarded-for") ?? "local"}`,
  );
  if (!limit.allowed) {
    return NextResponse.redirect(`${appUrl}/login?error=rate_limited`, 303);
  }

  const form = await request.formData().catch(() => null);
  const parsed = schema.safeParse({
    email: String(form?.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(form?.get("password") ?? ""),
    name: form?.get("name") ? String(form.get("name")) : undefined,
  });
  if (!parsed.success) {
    return NextResponse.redirect(`${appUrl}/login?error=weak_password&mode=register`, 303);
  }

  try {
    const user = await registerWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      acquisition: readAcquisitionCookie(request),
    });
    await createSession(user.id);
    return NextResponse.redirect(`${appUrl}/dashboard`, 303);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return NextResponse.redirect(`${appUrl}/login?error=email_taken&mode=register`, 303);
    }
    return NextResponse.redirect(`${appUrl}/login?error=register_failed&mode=register`, 303);
  }
}
