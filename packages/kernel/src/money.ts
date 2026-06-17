/**
 * @xentral/kernel — money primitives (pure, currency-agnostic).
 *
 * These encode the SACRED money-path invariants every module must obey:
 *  • amounts are rounded to 2 decimals,
 *  • a payment can never push paid beyond total (no over-apply),
 *  • status is derived, never written ad-hoc.
 * Modules (Books, Payments, ERP) build on these — they do not re-implement them.
 */

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

/** Round to 2 decimals, robust against binary float error. */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function statusFor(total: number, paid: number): PaymentStatus {
  if (paid <= 0) return "UNPAID";
  if (paid >= total - 0.01) return "PAID";
  return "PARTIALLY_PAID";
}

export type ApplyPaymentResult = {
  paid: number;
  status: PaymentStatus;
  fullyPaid: boolean;
  rejected?: "amount-must-be-positive" | "exceeds-outstanding";
};

/**
 * Apply a payment of `amount` to an invoice with `total` and `alreadyPaid`.
 * Returns the new paid figure + derived status, or a rejection reason
 * (state unchanged). Never over-applies.
 */
export function applyPayment(total: number, alreadyPaid: number, amount: number): ApplyPaymentResult {
  const t = roundMoney(total);
  const p = roundMoney(alreadyPaid);
  const a = roundMoney(amount);

  if (!(a > 0)) {
    return { paid: p, status: statusFor(t, p), fullyPaid: p >= t - 0.01, rejected: "amount-must-be-positive" };
  }
  const outstanding = roundMoney(t - p);
  if (a > outstanding + 0.01) {
    return { paid: p, status: statusFor(t, p), fullyPaid: p >= t - 0.01, rejected: "exceeds-outstanding" };
  }
  const paid = roundMoney(p + a);
  const status = statusFor(t, paid);
  return { paid, status, fullyPaid: status === "PAID" };
}
