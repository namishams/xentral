import { describe, it, expect } from "vitest";
import { requireCompany } from "./tenancy";
describe("kernel: tenancy", () => {
  it("returns the company id", () => {
    expect(requireCompany({ userId: "u", companyId: "c1", role: "ADMIN" })).toBe("c1");
  });
  it("refuses an unscoped session", () => {
    expect(() => requireCompany({ userId: "u", companyId: "", role: "ADMIN" })).toThrow("tenant-scope-required");
  });
});
