import { prisma, type User } from "@autocloud/db";
import { trackEvent } from "../analytics";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "user"
  );
}

async function uniqueOrgSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  throw new Error("Não foi possível gerar slug único de organização");
}

export interface UpsertUserInput {
  email: string;
  name?: string | null;
  githubId?: string;
  githubLogin?: string;
  avatarUrl?: string | null;
}

/**
 * Cria (ou atualiza) o usuário e garante a organização pessoal com plano free.
 */
export async function upsertUserWithPersonalOrg(input: UpsertUserInput): Promise<User> {
  const existing = input.githubId
    ? await prisma.user.findFirst({
        where: { OR: [{ githubId: input.githubId }, { email: input.email }] },
      })
    : await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name ?? existing.name,
        githubId: input.githubId ?? existing.githubId,
        githubLogin: input.githubLogin ?? existing.githubLogin,
        avatarUrl: input.avatarUrl ?? existing.avatarUrl,
      },
    });
  }

  const orgSlug = await uniqueOrgSlug(
    slugify(input.githubLogin ?? input.email.split("@")[0] ?? "user"),
  );
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      githubId: input.githubId,
      githubLogin: input.githubLogin,
      avatarUrl: input.avatarUrl,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: input.name ?? orgSlug,
              slug: orgSlug,
              ...(freePlan
                ? { subscription: { create: { planId: freePlan.id, status: "ACTIVE" } } }
                : {}),
            },
          },
        },
      },
    },
  });

  await trackEvent({ name: "user_registered", userId: user.id });
  return user;
}
