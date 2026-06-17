/**
 * @xentral/module-erp — PUBLIC CONTRACT.
 */

export type LedgerSection = { id: string; label: string };
export function getErpSections(): LedgerSection[] {
  return [
    { id: "gl", label: "General Ledger" },
    { id: "ap", label: "Accounts Payable" },
    { id: "banking", label: "Banking" },
    { id: "inventory", label: "Inventory" },
  ];
}

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
};

/** List products / inventory items. Seeded now; a real adapter replaces the body later. */
export function listProducts(): Product[] {
  return [
    { id: "p1", sku: "SRV-CONSULT", name: "Consulting hour", category: "Service", price: 600, currency: "AED", stock: 999 },
    { id: "p2", sku: "VAL-REPORT", name: "Valuation report", category: "Service", price: 2500, currency: "AED", stock: 999 },
    { id: "p3", sku: "KEY-LOCK", name: "Smart lock", category: "Hardware", price: 850, currency: "AED", stock: 6 },
    { id: "p4", sku: "SIGN-A2", name: "Signboard A2", category: "Hardware", price: 120, currency: "AED", stock: 0 },
    { id: "p5", sku: "BRO-PACK", name: "Brochure pack", category: "Marketing", price: 45, currency: "AED", stock: 240 },
  ];
}
