import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env";

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

/** State assinado com HMAC — evita CSRF no fluxo OAuth sem estado no banco. */
export function createOauthState(): string {
  const payload = `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  const sig = createHmac("sha256", env().AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyOauthState(state: string): boolean {
  const lastDot = state.lastIndexOf(".");
  if (lastDot < 0) return false;
  const payload = state.slice(0, lastDot);
  const sig = state.slice(lastDot + 1);
  const expected = createHmac("sha256", env().AUTH_SECRET).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const timestamp = Number(payload.split(".")[0]);
  return Number.isFinite(timestamp) && Date.now() - timestamp < 10 * 60 * 1000;
}

export function githubAuthorizeUrl(): string {
  const e = env();
  const params = new URLSearchParams({
    client_id: e.GITHUB_CLIENT_ID ?? "",
    redirect_uri: `${e.APP_URL}/api/auth/github/callback`,
    scope: "read:user user:email",
    state: createOauthState(),
  });
  return `${GITHUB_AUTHORIZE}?${params}`;
}

export interface GithubProfile {
  githubId: string;
  githubLogin: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export async function exchangeGithubCode(code: string): Promise<GithubProfile> {
  const e = env();
  const tokenResponse = await fetch(GITHUB_TOKEN, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: e.GITHUB_CLIENT_ID,
      client_secret: e.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenBody = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenBody.access_token) throw new Error("GitHub não retornou access_token");

  const headers = {
    Authorization: `Bearer ${tokenBody.access_token}`,
    Accept: "application/vnd.github+json",
  };
  const userResponse = await fetch(`${GITHUB_API}/user`, { headers });
  const profile = (await userResponse.json()) as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };

  let email = profile.email;
  if (!email) {
    const emailsResponse = await fetch(`${GITHUB_API}/user/emails`, { headers });
    const emails = (await emailsResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    email =
      emails.find((entry) => entry.primary && entry.verified)?.email ?? emails[0]?.email ?? null;
  }
  if (!email) throw new Error("Não foi possível obter e-mail do GitHub");

  return {
    githubId: String(profile.id),
    githubLogin: profile.login,
    name: profile.name,
    email,
    avatarUrl: profile.avatar_url,
  };
}
