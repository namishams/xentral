import { applyPayment, type PaymentStatus } from "@xentral/kernel";
export type PaymentMethod = { id: string; label: string };
export function getPaymentMethods(): PaymentMethod[] {
  return [
    { id: "card", label: "Card (Stripe / Telr)" },
    { id: "bank", label: "Bank transfer" },
    { id: "cash", label: "Cash" },
  ];
}
export { applyPayment };
export type { PaymentStatus };
