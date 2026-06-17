import { describe, it, expect } from "vitest";
import { roundMoney, applyPayment } from "./money";

describe("money: roundMoney", () => {
  it("rounds to 2 decimals robustly", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(99.999)).toBe(100);
  });
});

describe("money: applyPayment invariants", () => {
  it("never over-applies (rejects amount beyond outstanding)", () => {
    const r = applyPayment(100, 80, 50);
    expect(r.rejected).toBe("exceeds-outstanding");
    expect(r.paid).toBe(80); // state unchanged
  });

  it("marks PAID when fully settled", () => {
    const r = applyPayment(100, 0, 100);
    expect(r.status).toBe("PAID");
    expect(r.fullyPaid).toBe(true);
    expect(r.paid).toBe(100);
  });

  it("marks PARTIALLY_PAID on partial payment", () => {
    const r = applyPayment(100, 0, 40);
    expect(r.status).toBe("PARTIALLY_PAID");
    expect(r.fullyPaid).toBe(false);
    expect(r.paid).toBe(40);
  });

  it("settles exactly to the cent across two payments", () => {
    const a = applyPayment(100, 0, 33.33);
    const b = applyPayment(100, a.paid, 66.67);
    expect(b.paid).toBe(100);
    expect(b.status).toBe("PAID");
  });

  it("rejects non-positive amounts", () => {
    expect(applyPayment(100, 0, 0).rejected).toBe("amount-must-be-positive");
    expect(applyPayment(100, 0, -5).rejected).toBe("amount-must-be-positive");
  });
});
