import { prisma, type User } from "@autocloud/db";
import { trackEvent } from "../analytics";
import { adminEmails, isDev } from "../env";
import { notify } from "../notifications";

export interface AcquisitionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
}

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
  /** First-touch attribution capturada no cookie ac_attr (só em signup novo). */
  acquisition?: AcquisitionData | null;
}

/** Staff role vem de ADMIN_EMAILS; em dev, o dev-login vira SUPER_ADMIN. */
function resolveStaffRole(email: string): "SUPER_ADMIN" | "NONE" {
  if (adminEmails().includes(email.toLowerCase())) return "SUPER_ADMIN";
  if (isDev() && email === "dev@autocloud.local") return "SUPER_ADMIN";
  return "NONE";
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
        staffRole:
          resolveStaffRole(input.email) === "SUPER_ADMIN" ? "SUPER_ADMIN" : existing.staffRole,
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
      staffRole: resolveStaffRole(input.email),
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

  const membership = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  if (input.acquisition) {
    await prisma.acquisition.create({
      data: {
        userId: user.id,
        organizationId: membership?.organizationId,
        utmSource: input.acquisition.utmSource,
        utmMedium: input.acquisition.utmMedium,
        utmCampaign: input.acquisition.utmCampaign,
        utmContent: input.acquisition.utmContent,
        utmTerm: input.acquisition.utmTerm,
        referrer: input.acquisition.referrer,
        landingPage: input.acquisition.landingPage,
      },
    });
  }
  await notify({
    organizationId: membership?.organizationId,
    userId: user.id,
    type: "welcome",
    title: "Welcome to AutoCloud",
    body: "Run `npx autocloud deploy --yes` inside a project to publish it in minutes.",
  });
  await trackEvent({
    name: "user_registered",
    userId: user.id,
    organizationId: membership?.organizationId,
  });
  await trackEvent({
    name: "signup_completed",
    userId: user.id,
    organizationId: membership?.organizationId,
    properties: { source: input.acquisition?.utmSource ?? null },
  });
  return user;
}
