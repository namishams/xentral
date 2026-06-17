/**
 * @xentral/module-books — PUBLIC CONTRACT.
 * The only surface other packages may import. Pure data shapes — balance/VAT
 * math lives in @xentral/kernel (consumers compute via outstanding()).
 */

export type DocumentType = { id: string; label: string };
export function getDocumentTypes(): DocumentType[] {
  return [
    { id: "quote", label: "Quote" },
    { id: "invoice", label: "Invoice" },
    { id: "credit_note", label: "Credit note" },
  ];
}

export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
export type InvoiceRow = {
  id: string;
  number: string;
  customer: string;
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  currency: string;
  dueDate: string;
};

/** List invoices for the workspace. Seeded now; a real adapter replaces the body later. */
export function listInvoices(): InvoiceRow[] {
  return [
    { id: "1043", number: "INV-1043", customer: "Al Noor Real Estate", status: "PARTIALLY_PAID", total: 15225, amountPaid: 5725, currency: "AED", dueDate: "24 Jun" },
    { id: "1042", number: "INV-1042", customer: "Gulf Trading", status: "SENT", total: 8400, amountPaid: 0, currency: "AED", dueDate: "20 Jun" },
    { id: "1041", number: "INV-1041", customer: "Skyline Developers", status: "PAID", total: 32000, amountPaid: 32000, currency: "AED", dueDate: "12 Jun" },
    { id: "1040", number: "INV-1040", customer: "Damac Properties", status: "PARTIALLY_PAID", total: 19800, amountPaid: 9900, currency: "AED", dueDate: "28 Jun" },
    { id: "1039", number: "INV-1039", customer: "Emaar Group", status: "DRAFT", total: 5600, amountPaid: 0, currency: "AED", dueDate: "—" },
  ];
}
