import { describe, it, expect } from "vitest";
import { getPaymentMethods, applyPayment } from "./contract";
describe("payments contract", () => {
  it("lists card + bank methods", () => {
    const ids = getPaymentMethods().map((m) => m.id);
    expect(ids).toContain("card");
    expect(ids).toContain("bank");
  });
  it("re-uses the kernel money invariant (no over-apply)", () => {
    expect(applyPayment(100, 80, 50).rejected).toBe("exceeds-outstanding");
    expect(applyPayment(100, 0, 100).status).toBe("PAID");
  });
});
