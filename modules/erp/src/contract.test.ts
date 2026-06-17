import { describe, it, expect } from "vitest";
import { getErpSections, listProducts } from "./contract";

describe("erp contract", () => {
  it("exposes GL + inventory", () => {
    const ids = getErpSections().map((s) => s.id);
    expect(ids).toContain("gl");
    expect(ids).toContain("inventory");
  });

  it("lists products with unique sku and positive price", () => {
    const rows = listProducts();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(new Set(rows.map((r) => r.sku)).size).toBe(rows.length);
    for (const r of rows) {
      expect(r.price).toBeGreaterThan(0);
      expect(r.stock).toBeGreaterThanOrEqual(0);
    }
  });
});
