import { describe, it, expect } from "vitest";
import { getPortalSections } from "./contract";
describe("portal contract", () => {
  it("exposes overview + invoices among sections", () => {
    const ids = getPortalSections().map((s) => s.id);
    expect(ids).toContain("overview");
    expect(ids).toContain("invoices");
    expect(new Set(ids).size).toBe(ids.length);
  });
});
