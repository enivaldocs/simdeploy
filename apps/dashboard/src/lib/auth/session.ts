import { type Organization, prisma, type User } from "@simdeploy/db";
import { generateSessionToken, hashToken } from "@simdeploy/shared/crypto";
import { cookies } from "next/headers";
import { env } from "../env";

const SESSION_COOKIE = "ac_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionInfo {
  user: User;
  organization: Organization;
}

export async function createSession(userId: string): Promise<void> {
  const { token, tokenHash } = generateSessionToken();
  await prisma.session.create({
    data: { tokenHash, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Resolve a sessão do cookie; retorna null se ausente/expirada. */
export async function getSession(): Promise<SessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: { include: { organization: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;

  // MVP: usuário opera na primeira organização (pessoal). Multi-org já está
  // modelado no banco; o seletor de org é uma evolução de UI.
  const membership = session.user.memberships[0];
  if (!membership) return null;

  const { memberships: _memberships, ...user } = session.user;
  return { user: user as User, organization: membership.organization };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    cookieStore.delete(SESSION_COOKIE);
  }
}
