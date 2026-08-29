/**
 * Regras de RBAC de staff — módulo PURO (sem next/prisma) para teste isolado.
 */
export type StaffRoleName = "NONE" | "SUPPORT" | "FINANCE" | "OPERATIONS" | "ADMIN" | "SUPER_ADMIN";

export type StaffArea =
  | "overview"
  | "customers"
  | "projects"
  | "deployments"
  | "subscriptions"
  | "finance"
  | "usage"
  | "providers"
  | "webhooks"
  | "support"
  | "system"
  | "settings"
  | "growth";

const AREA_ROLES: Record<StaffArea, StaffRoleName[]> = {
  overview: ["SUPPORT", "FINANCE", "OPERATIONS", "ADMIN", "SUPER_ADMIN"],
  customers: ["SUPPORT", "FINANCE", "ADMIN", "SUPER_ADMIN"],
  projects: ["SUPPORT", "OPERATIONS", "ADMIN", "SUPER_ADMIN"],
  deployments: ["SUPPORT", "OPERATIONS", "ADMIN", "SUPER_ADMIN"],
  subscriptions: ["FINANCE", "SUPPORT", "ADMIN", "SUPER_ADMIN"],
  finance: ["FINANCE", "ADMIN", "SUPER_ADMIN"],
  usage: ["FINANCE", "OPERATIONS", "ADMIN", "SUPER_ADMIN"],
  providers: ["OPERATIONS", "ADMIN", "SUPER_ADMIN"],
  webhooks: ["OPERATIONS", "FINANCE", "ADMIN", "SUPER_ADMIN"],
  support: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  growth: ["FINANCE", "ADMIN", "SUPER_ADMIN"],
  system: ["OPERATIONS", "ADMIN", "SUPER_ADMIN"],
  settings: ["ADMIN", "SUPER_ADMIN"],
};

export function staffCanAccess(role: StaffRoleName, area: StaffArea): boolean {
  if (role === "NONE") return false;
  return AREA_ROLES[area].includes(role);
}

export function isStaff(role: StaffRoleName): boolean {
  return role !== "NONE";
}
