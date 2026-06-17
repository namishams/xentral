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

export type OrderStatus = "open" | "processing" | "fulfilled" | "cancelled";
export type OrderRow = {
  id: string;
  number: string;
  customer: string;
  status: OrderStatus;
  items: number;
  total: number;
  currency: string;
  date: string;
};

/** List sales orders for the workspace. Seeded now; a real adapter replaces the body later. */
export function listOrders(): OrderRow[] {
  return [
    { id: "SO-2051", number: "SO-2051", customer: "Skyline Developers", status: "processing", items: 4, total: 48000, currency: "AED", date: "17 Jun" },
    { id: "SO-2050", number: "SO-2050", customer: "Gulf Trading", status: "open", items: 2, total: 12000, currency: "AED", date: "16 Jun" },
    { id: "SO-2049", number: "SO-2049", customer: "Al Noor Real Estate", status: "fulfilled", items: 7, total: 31500, currency: "AED", date: "14 Jun" },
    { id: "SO-2048", number: "SO-2048", customer: "Damac Properties", status: "processing", items: 1, total: 25000, currency: "AED", date: "13 Jun" },
    { id: "SO-2047", number: "SO-2047", customer: "Emaar Group", status: "cancelled", items: 3, total: 9000, currency: "AED", date: "11 Jun" },
    { id: "SO-2046", number: "SO-2046", customer: "Bright Interiors", status: "fulfilled", items: 5, total: 18600, currency: "AED", date: "10 Jun" },
  ];
}

export type SupplierRow = {
  id: string;
  name: string;
  category: string;
  country: string;
  openOrders: number;
};

/** List suppliers / vendors for the workspace. Seeded now; a real adapter replaces the body later. */
export function listSuppliers(): SupplierRow[] {
  return [
    { id: "v1", name: "Emirates Steel", category: "Materials", country: "UAE", openOrders: 2 },
    { id: "v2", name: "Dubai Hardware Co", category: "Hardware", country: "UAE", openOrders: 1 },
    { id: "v3", name: "Gulf Print House", category: "Marketing", country: "UAE", openOrders: 0 },
    { id: "v4", name: "Shenzhen Locks Ltd", category: "Hardware", country: "China", openOrders: 3 },
    { id: "v5", name: "Falcon Logistics", category: "Services", country: "UAE", openOrders: 1 },
  ];
}

export type BillStatus = "open" | "approved" | "overdue" | "paid";
export type BillRow = {
  id: string;
  number: string;
  supplier: string;
  status: BillStatus;
  amount: number;
  currency: string;
  dueDate: string;
};

/** List supplier bills (accounts payable). Seeded now; a real adapter replaces the body later. */
export function listBills(): BillRow[] {
  return [
    { id: "b1", number: "BILL-771", supplier: "Emirates Steel", status: "approved", amount: 22000, currency: "AED", dueDate: "22 Jun" },
    { id: "b2", number: "BILL-772", supplier: "Shenzhen Locks Ltd", status: "overdue", amount: 8400, currency: "AED", dueDate: "10 Jun" },
    { id: "b3", number: "BILL-773", supplier: "Gulf Print House", status: "open", amount: 1500, currency: "AED", dueDate: "28 Jun" },
    { id: "b4", number: "BILL-770", supplier: "Falcon Logistics", status: "paid", amount: 3200, currency: "AED", dueDate: "08 Jun" },
  ];
}

export type PurchaseStatus = "draft" | "sent" | "received" | "cancelled";
export type PurchaseRow = {
  id: string;
  number: string;
  supplier: string;
  status: PurchaseStatus;
  items: number;
  total: number;
  currency: string;
  date: string;
};

/** List purchase orders (procurement). Seeded now; a real adapter replaces the body later. */
export function listPurchases(): PurchaseRow[] {
  return [
    { id: "po1", number: "PO-902", supplier: "Emirates Steel", status: "sent", items: 3, total: 22000, currency: "AED", date: "16 Jun" },
    { id: "po2", number: "PO-901", supplier: "Dubai Hardware Co", status: "received", items: 5, total: 6400, currency: "AED", date: "12 Jun" },
    { id: "po3", number: "PO-903", supplier: "Shenzhen Locks Ltd", status: "draft", items: 2, total: 9000, currency: "AED", date: "17 Jun" },
    { id: "po4", number: "PO-900", supplier: "Gulf Print House", status: "cancelled", items: 1, total: 1500, currency: "AED", date: "09 Jun" },
  ];
}

export type WarehouseRow = {
  id: string;
  name: string;
  location: string;
  items: number;
  capacityPct: number;
};

/** List warehouses / storage locations. Seeded now; a real adapter replaces the body later. */
export function listWarehouses(): WarehouseRow[] {
  return [
    { id: "w1", name: "Dubai Main DC", location: "Al Quoz, Dubai", items: 1240, capacityPct: 72 },
    { id: "w2", name: "Sharjah Store", location: "Industrial 3, Sharjah", items: 430, capacityPct: 38 },
    { id: "w3", name: "Abu Dhabi Hub", location: "Mussafah, Abu Dhabi", items: 880, capacityPct: 91 },
  ];
}
