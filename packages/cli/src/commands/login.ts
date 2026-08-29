import pc from "picocolors";
import { apiRequest } from "../api-client.js";
import { DEFAULT_API_URL, readConfig, writeConfig } from "../config.js";
import { check, fail, heading, info } from "../output.js";

interface MeResponse {
  user: { email: string };
  organization: { slug: string };
  scopes: string[];
}

export async function loginCommand(options: { token?: string; apiUrl?: string }): Promise<void> {
  heading();
  const apiUrl = options.apiUrl ?? readConfig().apiUrl ?? DEFAULT_API_URL;

  if (!options.token) {
    fail("Informe um API token: autocloud login --token <ac_live_...>");
    info(`Crie um token no dashboard: ${apiUrl}/dashboard/settings`);
    process.exitCode = 1;
    return;
  }
  if (!options.token.startsWith("ac_live_")) {
    fail("Token inválido — tokens AutoCloud começam com ac_live_");
    process.exitCode = 1;
    return;
  }

  writeConfig({ apiUrl, token: options.token });
  try {
    const me = await apiRequest<MeResponse>("/api/v1/me");
    check(`Autenticado como ${pc.bold(me.user.email)} (org: ${me.organization.slug})`);
    info(`API: ${apiUrl}`);
    info(`Scopes: ${me.scopes.join(", ")}`);
  } catch (error) {
    writeConfig({ apiUrl });
    fail(`Token rejeitado: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
