import { type Organization, prisma, type User } from "@simdeploy/db";
import { API_TOKEN_PREFIX, TOKEN_SCOPES, type TokenScope } from "@simdeploy/shared";
import { hashToken } from "@simdeploy/shared/crypto";
import type { NextRequest } from "next/server";
import { getSession } from "../auth/session";
import { rateLimiters } from "../rate-limit";
import { forbidden, HttpError, unauthorized } from "./respond";

export interface ApiAuthContext {
  kind: "session" | "token";
  user: User;
  organization: Organization;
  /** Scopes efetivos: sessão tem todos; token tem os concedidos. */
  scopes: readonly TokenScope[];
  tokenId?: string;
}

/**
 * Autentica uma request da API v1: Bearer token (CLI/MCP/agents) ou cookie de
 * sessão (dashboard). Aplica rate limit por identidade.
 */
export async function authenticateApi(request: NextRequest): Promise<ApiAuthContext> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice("Bearer ".length).trim();
    if (!raw.startsWith(API_TOKEN_PREFIX)) throw unauthorized();

    const token = await prisma.apiToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true, organization: true },
    });
    if (!token || token.revokedAt) throw unauthorized();
    if (token.expiresAt && token.expiresAt < new Date()) {
      throw new HttpError(401, "token_expired", "API token expirado.");
    }

    enforceRateLimit(`token:${token.id}`);
    // lastUsedAt é telemetria — não bloqueia a request.
    prisma.apiToken
      .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return {
      kind: "token",
      user: token.user,
      organization: token.organization,
      scopes: token.scopes as TokenScope[],
      tokenId: token.id,
    };
  }

  const session = await getSession();
  if (!session) throw unauthorized();
  enforceRateLimit(`user:${session.user.id}`);
  return {
    kind: "session",
    user: session.user,
    organization: session.organization,
    scopes: TOKEN_SCOPES,
  };
}

function enforceRateLimit(key: string): void {
  const result = rateLimiters().api.limit(key);
  if (!result.allowed) {
    throw new HttpError(
      429,
      "rate_limited",
      `Rate limit excedido. Tente em ${result.retryAfterSec}s.`,
    );
  }
}

export function requireScope(auth: ApiAuthContext, scope: TokenScope): void {
  if (!auth.scopes.includes(scope)) {
    throw forbidden(`Este token não tem o scope necessário: ${scope}`);
  }
}

/** Carrega um projeto garantindo isolamento por organização. */
export async function getProjectForOrg(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  });
  return project;
}
