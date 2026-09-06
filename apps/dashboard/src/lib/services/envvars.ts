import { prisma } from "@simdeploy/db";
import { decryptSecret, encryptSecret } from "@simdeploy/shared/crypto";
import { audit } from "../audit";
import { env } from "../env";

export type EnvTarget = "production" | "preview" | "all";

async function resolveEnvironmentId(projectId: string, target: EnvTarget): Promise<string | null> {
  if (target === "all") return null;
  const environment = await prisma.environment.findUnique({
    where: { projectId_name: { projectId, name: target } },
  });
  return environment?.id ?? null;
}

export async function setEnvVar(input: {
  projectId: string;
  organizationId: string;
  userId: string;
  key: string;
  value: string;
  target: EnvTarget;
}): Promise<void> {
  const environmentId = await resolveEnvironmentId(input.projectId, input.target);
  const valueEncrypted = encryptSecret(input.value, env().ENCRYPTION_KEY);

  const existing = await prisma.environmentVariable.findFirst({
    where: { projectId: input.projectId, environmentId, key: input.key },
  });
  if (existing) {
    await prisma.environmentVariable.update({
      where: { id: existing.id },
      data: { valueEncrypted },
    });
  } else {
    await prisma.environmentVariable.create({
      data: { projectId: input.projectId, environmentId, key: input.key, valueEncrypted },
    });
  }

  // Auditoria registra a chave, nunca o valor.
  await audit({
    organizationId: input.organizationId,
    userId: input.userId,
    action: "env.set",
    resourceType: "environment_variable",
    resourceId: input.key,
    metadata: { projectId: input.projectId, target: input.target },
  });
}

export interface EnvVarListItem {
  id: string;
  key: string;
  target: EnvTarget;
  updatedAt: string;
}

/** Lista SEM valores — secrets nunca voltam depois de salvos. */
export async function listEnvVars(projectId: string): Promise<EnvVarListItem[]> {
  const vars = await prisma.environmentVariable.findMany({
    where: { projectId },
    include: { environment: true },
    orderBy: { key: "asc" },
  });
  return vars.map((v) => ({
    id: v.id,
    key: v.key,
    target: (v.environment?.name as EnvTarget) ?? "all",
    updatedAt: v.updatedAt.toISOString(),
  }));
}

export async function deleteEnvVar(input: {
  projectId: string;
  organizationId: string;
  userId: string;
  key: string;
}): Promise<number> {
  const result = await prisma.environmentVariable.deleteMany({
    where: { projectId: input.projectId, key: input.key },
  });
  if (result.count > 0) {
    await audit({
      organizationId: input.organizationId,
      userId: input.userId,
      action: "env.delete",
      resourceType: "environment_variable",
      resourceId: input.key,
      metadata: { projectId: input.projectId },
    });
  }
  return result.count;
}

/** Env decriptado para injeção em runtime de deployment (uso do pipeline). */
export async function getDecryptedEnv(
  projectId: string,
  target: Exclude<EnvTarget, "all">,
): Promise<Record<string, string>> {
  const environmentId = await resolveEnvironmentId(projectId, target);
  const vars = await prisma.environmentVariable.findMany({
    where: { projectId, OR: [{ environmentId: null }, { environmentId }] },
  });
  const result: Record<string, string> = {};
  for (const v of vars) {
    result[v.key] = decryptSecret(v.valueEncrypted, env().ENCRYPTION_KEY);
  }
  return result;
}
