import { prisma } from "@autocloud/db";
import { audit } from "../audit";

/**
 * Configuração operacional (AppConfig): fx rate, feature flags, maintenance.
 * Nunca secrets. Toda escrita é auditada com before/after.
 */
export async function getConfig<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  return row ? (row.value as T) : fallback;
}

export async function setConfig(
  key: string,
  value: unknown,
  actor: { userId: string; ip?: string; userAgent?: string },
): Promise<void> {
  const before = await prisma.appConfig.findUnique({ where: { key } });
  await prisma.appConfig.upsert({
    where: { key },
    create: { key, value: value as object, updatedById: actor.userId },
    update: { value: value as object, updatedById: actor.userId },
  });
  await audit({
    userId: actor.userId,
    action: "admin.config_set",
    resourceType: "app_config",
    resourceId: key,
    before: before?.value ?? null,
    after: value,
    ip: actor.ip,
    userAgent: actor.userAgent,
  });
}

/**
 * Taxa USD→BRL usada para converter custos de provider (USD) em margem (BRL).
 * SEM taxa configurada, margens multi-moeda mostram "Not available" —
 * nunca uma taxa inventada.
 */
export async function getFxRateUsdBrl(): Promise<number | null> {
  const value = await getConfig<{ rate?: number } | null>("fx_rate_usd_brl", null);
  return value?.rate && value.rate > 0 ? value.rate : null;
}

export interface FeatureFlag {
  enabled: boolean;
  plans?: string[];
  organizations?: string[];
}

export async function getFeatureFlags(): Promise<Record<string, FeatureFlag>> {
  return getConfig<Record<string, FeatureFlag>>("feature_flags", {});
}

/** Flag ativa se global OU liberada para o plano/organização. */
export async function isFeatureEnabled(
  flagKey: string,
  context: { planSlug?: string; organizationId?: string } = {},
): Promise<boolean> {
  const flags = await getFeatureFlags();
  const flag = flags[flagKey];
  if (!flag) return false;
  if (flag.enabled) return true;
  if (context.planSlug && flag.plans?.includes(context.planSlug)) return true;
  if (context.organizationId && flag.organizations?.includes(context.organizationId)) return true;
  return false;
}
