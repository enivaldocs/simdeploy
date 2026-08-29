import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/respond";
import { githubAuthorizeUrl } from "@/lib/auth/github";
import { githubOauthConfigured } from "@/lib/env";

export function GET(): NextResponse {
  if (!githubOauthConfigured()) {
    return apiError(501, "oauth_not_configured", "GitHub OAuth não configurado neste ambiente.");
  }
  return NextResponse.redirect(githubAuthorizeUrl());
}
