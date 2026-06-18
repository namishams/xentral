import { createHash } from "crypto";

/**
 * FTA e-Invoicing — PINT-AE (Peppol International Invoice, UAE) generator.
 * Produces a UBL 2.1 / PINT-AE structured XML from a Books invoice, with
 * structural validation. Xentral generates + validates; an accredited ASP
 * transmits to the FTA. This is NOT an accreditation claim.
 */

type Dec = number | string | null | undefined;
const n = (v: Dec): number => { if (v === null || v === undefined) return 0; const x = typeof v === "number" ? v : Number(v); return isNaN(x) ? 0 : x; };
const money = (v: Dec) => n(v).toFixed(2);
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const ymd = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export type EInvLine = { name: string; description?: string | null; qty: Dec; unitPrice: Dec; vatRate: Dec; discountPct?: Dec; lineTotal: Dec };
/** Net (tax-exclusive) line amount per UBL — derived, never trusting a possibly-gross stored total. */
const lineNet = (l: EInvLine) => n(l.qty) * n(l.unitPrice) * (1 - n(l.discountPct) / 100);
export type EInvInput = {
  number: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  currency?: string | null;
  isCreditNote?: boolean;
  subtotal: Dec; discountTotal?: Dec; vatTotal: Dec; total: Dec;
  supplier: { name: string; trn?: string | null; addressLine1?: string | null; city?: string | null; country?: string | null };
  customer: { name: string; trn?: string | null; addressLine1?: string | null; city?: string | null; country?: string | null };
  lines: EInvLine[];
};

/** Structural / arithmetic validation against PINT-AE expectations. */
export function validatePintAe(inv: EInvInput): string[] {
  const errs: string[] = [];
  if (!inv.supplier.trn) errs.push("Supplier TRN (VAT number) is required on a tax invoice.");
  else if (!/^\d{15}$/.test(inv.supplier.trn)) errs.push("Supplier TRN must be exactly 15 digits.");
  if (!inv.supplier.name) errs.push("Supplier legal name is required.");
  if (!inv.customer.name) errs.push("Customer name is required.");
  if (!inv.number) errs.push("Invoice number is required.");
  if (!inv.lines || inv.lines.length === 0) errs.push("At least one invoice line is required.");
  // arithmetic: lines sum ≈ subtotal; subtotal - discount + vat ≈ total
  const lineSum = (inv.lines || []).reduce((a, l) => a + lineNet(l), 0);
  if (Math.abs(lineSum - n(inv.subtotal)) > 0.02) errs.push(`Line total ${money(lineSum)} does not reconcile to subtotal ${money(inv.subtotal)}.`);
  const expectedTotal = n(inv.subtotal) - n(inv.discountTotal) + n(inv.vatTotal);
  if (Math.abs(expectedTotal - n(inv.total)) > 0.02) errs.push(`Subtotal − discount + VAT (${money(expectedTotal)}) does not equal total ${money(inv.total)}.`);
  return errs;
}

function partyXml(tag: string, p: EInvInput["supplier"]) {
  return `  <cac:${tag}>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(p.addressLine1 ?? "")}</cbc:StreetName>
        <cbc:CityName>${esc(p.city ?? "")}</cbc:CityName>
        <cac:Country><cbc:IdentificationCode>AE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${p.trn ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(p.trn)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity><cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:${tag}>`;
}

/** Build the PINT-AE UBL XML string. */
export function buildPintAeXml(inv: EInvInput): string {
  const cur = inv.currency || "AED";
  const typeCode = inv.isCreditNote ? "381" : "380";
  const taxable = n(inv.subtotal) - n(inv.discountTotal);
  // group tax by rate for TaxSubtotals
  const byRate = new Map<number, { taxable: number; tax: number }>();
  for (const l of inv.lines) {
    const r = n(l.vatRate);
    const base = lineNet(l);
    const g = byRate.get(r) || { taxable: 0, tax: 0 };
    g.taxable += base; g.tax += base * (r / 100);
    byRate.set(r, g);
  }
  const taxSubtotals = [...byRate.entries()].map(([rate, g]) => `    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${cur}">${money(g.taxable)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${cur}">${money(g.tax)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${rate > 0 ? "S" : "Z"}</cbc:ID>
        <cbc:Percent>${money(rate)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join("\n");

  const lines = inv.lines.map((l, i) => {
    const qty = n(l.qty);
    return `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${cur}">${money(lineNet(l))}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(l.name)}</cbc:Name>
      ${l.description ? `<cbc:Description>${esc(l.description)}</cbc:Description>` : ""}
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${n(l.vatRate) > 0 ? "S" : "Z"}</cbc:ID>
        <cbc:Percent>${money(l.vatRate)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="${cur}">${money(l.unitPrice)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:peppol:pint:billing-1@ae-1</cbc:CustomizationID>
  <cbc:ProfileID>urn:peppol:bis:billing</cbc:ProfileID>
  <cbc:ID>${esc(inv.number)}</cbc:ID>
  <cbc:IssueDate>${ymd(inv.issueDate)}</cbc:IssueDate>
  ${inv.dueDate ? `<cbc:DueDate>${ymd(inv.dueDate)}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>${typeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${cur}</cbc:DocumentCurrencyCode>
${partyXml("AccountingSupplierParty", inv.supplier)}
${partyXml("AccountingCustomerParty", inv.customer)}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${cur}">${money(inv.vatTotal)}</cbc:TaxAmount>
${taxSubtotals}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${cur}">${money(inv.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${cur}">${money(taxable)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${cur}">${money(inv.total)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${cur}">${money(inv.discountTotal)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="${cur}">${money(inv.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>`;
}

export function xmlHash(xml: string): string {
  return createHash("sha256").update(xml, "utf8").digest("hex");
}
