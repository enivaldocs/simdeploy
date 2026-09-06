import { prisma } from "@simdeploy/db";
import { API_TOKEN_PREFIX } from "@simdeploy/shared";
import { hashToken } from "@simdeploy/shared/crypto";
import { type NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/respond";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { rateLimiters } from "@/lib/rate-limit";

/**
 * Login web com um API token (sd_live_...). Destrava o dashboard para quem
 * já opera via CLI — especialmente antes do OAuth estar configurado.
 * O token não é armazenado; vira uma sessão normal do dono do token.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimiters().auth.limit(
    `token-login:${request.headers.get("x-forwarded-for") ?? "local"}`,
  );
  if (!limit.allowed) {
    return NextResponse.redirect(`${env().APP_URL}/login?error=rate_limited`, 303);
  }

  const form = await request.formData().catch(() => null);
  const raw = String(form?.get("token") ?? "").trim();
  if (!raw.startsWith(API_TOKEN_PREFIX)) {
    return NextResponse.redirect(`${env().APP_URL}/login?error=token_invalid`, 303);
  }

  const token = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!token || token.revokedAt || (token.expiresAt && token.expiresAt < new Date())) {
    return NextResponse.redirect(`${env().APP_URL}/login?error=token_invalid`, 303);
  }

  await createSession(token.userId);
  await audit({
    organizationId: token.organizationId,
    userId: token.userId,
    action: "auth.token_login",
    resourceType: "session",
    metadata: { tokenId: token.id },
    ip: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  return NextResponse.redirect(`${env().APP_URL}/dashboard`, 303);
}

export function GET() {
  return apiError(405, "method_not_allowed", "Use POST.");
}
