import { describe, it, expect } from "vitest";
import { outstanding } from "./document";
describe("kernel: document", () => {
  it("computes outstanding balance", () => {
    expect(outstanding({ total: 100, amountPaid: 30, currency: "AED", status: "PARTIALLY_PAID" })).toBe(70);
  });
});
