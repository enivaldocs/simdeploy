import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Cliente da API SimDeploy para o MCP server. Reusa a autenticação da CLI
 * (~/.simdeploy/config.json, criada por `simdeploy login`).
 */
export interface McpApiConfig {
  apiUrl: string;
  token?: string;
}

export function readCliConfig(): McpApiConfig {
  const fallback = { apiUrl: process.env.SIMDEPLOY_API_URL ?? "http://localhost:3000" };
  try {
    return {
      ...fallback,
      ...JSON.parse(readFileSync(join(homedir(), ".simdeploy", "config.json"), "utf8")),
    };
  } catch {
    return fallback;
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {},
): Promise<T> {
  const config = readCliConfig();
  if (!config.token) {
    throw new Error(
      "SimDeploy não autenticada. Rode `simdeploy login --token <sd_live_...>` primeiro (crie o token no dashboard em /dashboard/settings).",
    );
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "User-Agent": "simdeploy-mcp/0.1.0",
  };
  let body: string | FormData | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `SimDeploy API: HTTP ${response.status}`);
  }
  return payload as T;
}
