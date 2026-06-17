import { describe, it, expect } from "vitest";
import { getDefaultPipeline, listDeals } from "./contract";

describe("crm contract", () => {
  it("has ordered, unique stages ending in won/lost", () => {
    const s = getDefaultPipeline();
    expect(s.map((x) => x.order)).toEqual([1, 2, 3, 4, 5]);
    expect(s.some((x) => x.id === "won")).toBe(true);
  });

  it("lists deals with unique ids and valid stages", () => {
    const rows = listDeals();
    const stages = getDefaultPipeline().map((s) => s.id);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) {
      expect(stages).toContain(r.stage);
      expect(r.value).toBeGreaterThan(0);
    }
  });
});
