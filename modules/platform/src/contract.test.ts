import { describe, it, expect } from "vitest";
import { __resetDataSource } from "@xentral/kernel";
import { getPlanTiers, listUsers, loadUsers } from "./contract";

describe("platform contract", () => {
  it("exposes the three plan tiers", () => {
    expect(getPlanTiers().map((t) => t.id)).toEqual(["free", "pro", "enterprise"]);
  });

  it("seed users carry an email and a role", () => {
    for (const u of listUsers()) {
      expect(u.email).toContain("@");
      expect(u.role.length).toBeGreaterThan(0);
    }
  });

  it("loadUsers falls back to seed when no data source is registered", async () => {
    __resetDataSource();
    expect(await loadUsers()).toEqual(listUsers());
    expect(await loadUsers({ companyId: "T-1" })).toEqual(listUsers());
  });
});
