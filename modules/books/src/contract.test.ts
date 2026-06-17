import { describe, it, expect } from "vitest";
import { getDocumentTypes, listInvoices } from "./contract";
import { outstanding } from "@xentral/kernel";

describe("books contract", () => {
  it("includes quote + invoice", () => {
    const ids = getDocumentTypes().map((d) => d.id);
    expect(ids).toContain("quote");
    expect(ids).toContain("invoice");
  });

  it("lists invoices with unique ids and consistent balances", () => {
    const rows = listInvoices();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) {
      const bal = outstanding({ total: r.total, amountPaid: r.amountPaid, currency: r.currency, status: "PARTIALLY_PAID" });
      expect(bal).toBe(Math.round((r.total - r.amountPaid) * 100) / 100);
      if (r.status === "PAID") expect(bal).toBe(0);
    }
  });
});
