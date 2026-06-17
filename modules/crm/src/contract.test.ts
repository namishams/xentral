import { describe, it, expect } from "vitest";
import { __resetDataSource } from "@xentral/kernel";
import { getDefaultPipeline, listDeals, listContacts, listCompanies, listLeads, loadContacts } from "./contract";

describe("crm contract", () => {
  it("default pipeline is ordered", () => {
    const stages = getDefaultPipeline();
    const orders = stages.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("deals carry a known stage and positive value", () => {
    const valid = new Set(getDefaultPipeline().map((s) => s.id));
    for (const d of listDeals()) {
      expect(valid.has(d.stage)).toBe(true);
      expect(d.value).toBeGreaterThan(0);
    }
  });

  it("contacts expose name + email + owner", () => {
    for (const c of listContacts()) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.email).toContain("@");
      expect(c.owner.length).toBeGreaterThan(0);
    }
  });

  it("companies have non-negative open deal counts", () => {
    for (const a of listCompanies()) {
      expect(a.openDeals).toBeGreaterThanOrEqual(0);
    }
  });

  it("lead scores are within 0–100", () => {
    for (const l of listLeads()) {
      expect(l.score).toBeGreaterThanOrEqual(0);
      expect(l.score).toBeLessThanOrEqual(100);
    }
  });

  it("loadContacts falls back to seed when no data source is registered", async () => {
    __resetDataSource();
    expect(await loadContacts()).toEqual(listContacts());
    // even with a scope, no registered source → seed (safe on public preview)
    expect(await loadContacts({ companyId: "T-1" })).toEqual(listContacts());
  });
});
