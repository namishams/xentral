import { roundMoney } from "./money";
export type DocStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
export type MoneyDoc = { total: number; amountPaid: number; currency: string; status: DocStatus };

/** Outstanding balance, rounded. Single source for "what is still owed". */
export function outstanding(doc: MoneyDoc): number {
  return roundMoney(doc.total - doc.amountPaid);
}
