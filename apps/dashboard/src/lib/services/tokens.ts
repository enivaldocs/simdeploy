import { type ApiToken, prisma } from "@simdeploy/db";
import type { TokenScope } from "@simdeploy/shared";
import { generateApiToken } from "@simdeploy/shared/crypto";
import { audit } from "../audit";

export async function createApiToken(input: {
  organizationId: string;
  userId: string;
  name: string;
  scopes: TokenScope[];
  expiresInDays?: number;
}): Promise<{ token: string; record: ApiToken }> {
  const generated = generateApiToken();
  const record = await prisma.apiToken.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      name: input.name,
      tokenHash: generated.tokenHash,
      displayPrefix: generated.displayPrefix,
      scopes: input.scopes,
      expiresAt: input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });
  await audit({
    organizationId: input.organizationId,
    userId: input.userId,
    action: "token.create",
    resourceType: "api_token",
    resourceId: record.id,
    metadata: { name: input.name, scopes: input.scopes },
  });
  // O token em claro sai UMA vez — nunca é persistido.
  return { token: generated.token, record };
}

export async function listApiTokens(organizationId: string) {
  const tokens = await prisma.apiToken.findMany({
    where: { organizationId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return tokens.map((t) => ({
    id: t.id,
    name: t.name,
    displayPrefix: t.displayPrefix,
    scopes: t.scopes,
    lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
    expiresAt: t.expiresAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function revokeApiToken(input: {
  organizationId: string;
  userId: string;
  tokenId: string;
}): Promise<boolean> {
  const result = await prisma.apiToken.updateMany({
    where: { id: input.tokenId, organizationId: input.organizationId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count > 0) {
    await audit({
      organizationId: input.organizationId,
      userId: input.userId,
      action: "token.revoke",
      resourceType: "api_token",
      resourceId: input.tokenId,
    });
  }
  return result.count > 0;
}
