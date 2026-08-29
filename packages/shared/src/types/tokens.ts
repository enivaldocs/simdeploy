import { z } from "zod";

export const TOKEN_SCOPES = [
  "projects:read",
  "projects:write",
  "deployments:read",
  "deployments:write",
  "logs:read",
  "env:read",
  "env:write",
  "cost:read",
] as const;
export const tokenScopeSchema = z.enum(TOKEN_SCOPES);
export type TokenScope = z.infer<typeof tokenScopeSchema>;

export const API_TOKEN_PREFIX = "ac_live_";

/** Scopes padrão para tokens criados pela CLI (fluxo autocloud login). */
export const CLI_DEFAULT_SCOPES: readonly TokenScope[] = [
  "projects:read",
  "projects:write",
  "deployments:read",
  "deployments:write",
  "logs:read",
  "env:read",
  "env:write",
  "cost:read",
];
