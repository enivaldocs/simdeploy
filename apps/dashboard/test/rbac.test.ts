import { describe, expect, it } from "vitest";
import { isStaff, staffCanAccess } from "@/lib/auth/staff-rules";

describe("staff RBAC", () => {
  it("NONE não acessa nenhuma área", () => {
    expect(isStaff("NONE")).toBe(false);
    expect(staffCanAccess("NONE", "overview")).toBe(false);
    expect(staffCanAccess("NONE", "finance")).toBe(false);
  });

  it("SUPER_ADMIN acessa todas as áreas", () => {
    for (const area of [
      "overview",
      "customers",
      "finance",
      "settings",
      "system",
      "webhooks",
      "growth",
    ] as const) {
      expect(staffCanAccess("SUPER_ADMIN", area)).toBe(true);
    }
  });

  it("FINANCE acessa finance mas não settings nem system", () => {
    expect(staffCanAccess("FINANCE", "finance")).toBe(true);
    expect(staffCanAccess("FINANCE", "growth")).toBe(true);
    expect(staffCanAccess("FINANCE", "settings")).toBe(false);
    expect(staffCanAccess("FINANCE", "system")).toBe(false);
  });

  it("SUPPORT acessa customers mas não finance", () => {
    expect(staffCanAccess("SUPPORT", "customers")).toBe(true);
    expect(staffCanAccess("SUPPORT", "support")).toBe(true);
    expect(staffCanAccess("SUPPORT", "finance")).toBe(false);
  });

  it("OPERATIONS acessa system/providers mas não finance", () => {
    expect(staffCanAccess("OPERATIONS", "system")).toBe(true);
    expect(staffCanAccess("OPERATIONS", "providers")).toBe(true);
    expect(staffCanAccess("OPERATIONS", "finance")).toBe(false);
  });
});
