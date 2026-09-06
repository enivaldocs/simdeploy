/**
 * Bootstrap do primeiro admin em produção (onde não existe dev-login).
 * Cria usuário SUPER_ADMIN + organização + assinatura free + API token.
 * O token é impresso UMA vez. Rodar na VPS: node deploy/bootstrap-admin.mjs <email>
 * Idempotente: se o usuário já existe, apenas emite um token novo.
 */
import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { join } from "node:path";

// Resolve @prisma/client a partir do cwd (rodar de packages/db).
const require = createRequire(join(process.cwd(), "package.json"));
const { PrismaClient } = require("@prisma/client");

const email = process.argv[2];
if (!email) {
  console.error("uso: node deploy/bootstrap-admin.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

const SCOPES = [
  "projects:read",
  "projects:write",
  "deployments:read",
  "deployments:write",
  "logs:read",
  "env:read",
  "env:write",
  "cost:read",
  "billing:read",
];

function slugify(input) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "admin"
  );
}

let user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  const orgSlug = `${slugify(email.split("@")[0])}-${randomBytes(2).toString("hex")}`;
  user = await prisma.user.create({
    data: {
      email,
      name: "Admin",
      staffRole: "SUPER_ADMIN",
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: orgSlug,
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
  console.error(`usuario criado: ${email}`);
} else {
  await prisma.user.update({ where: { id: user.id }, data: { staffRole: "SUPER_ADMIN" } });
  console.error(`usuario existente promovido: ${email}`);
}

const membership = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
const token = `sd_live_${randomBytes(24).toString("hex")}`;
await prisma.apiToken.create({
  data: {
    organizationId: membership.organizationId,
    userId: user.id,
    name: `bootstrap-${new Date().toISOString().slice(0, 10)}`,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    displayPrefix: token.slice(0, 14),
    scopes: SCOPES,
  },
});

// Só o token no stdout — para captura programática.
console.log(token);
await prisma.$disconnect();
