import { type NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics";
import { exchangeGithubCode, verifyOauthState } from "@/lib/auth/github";
import { createSession } from "@/lib/auth/session";
import { upsertUserWithPersonalOrg } from "@/lib/auth/users";
import { env } from "@/lib/env";
import { rateLimiters } from "@/lib/rate-limit";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limit = rateLimiters().auth.limit(request.headers.get("x-forwarded-for") ?? "local");
  if (!limit.allowed) {
    return NextResponse.redirect(`${env().APP_URL}/login?error=rate_limited`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || !verifyOauthState(state)) {
    return NextResponse.redirect(`${env().APP_URL}/login?error=oauth_invalid`);
  }

  try {
    const profile = await exchangeGithubCode(code);
    const user = await upsertUserWithPersonalOrg({
      email: profile.email,
      name: profile.name,
      githubId: profile.githubId,
      githubLogin: profile.githubLogin,
      avatarUrl: profile.avatarUrl,
    });
    await createSession(user.id);
    await trackEvent({ name: "github_connected", userId: user.id });
    return NextResponse.redirect(`${env().APP_URL}/dashboard`);
  } catch {
    return NextResponse.redirect(`${env().APP_URL}/login?error=oauth_failed`);
  }
}
