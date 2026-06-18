import type { DocumentPdfData } from "./books-pdf";

/**
 * Xentral Books — assembles modern UAE-corporate (English) PDF payloads from DB records.
 * Shared by the PDF route, preview route and the email-send routes.
 */

type SettingsLike = {
  legalName?: string | null; addressLine1?: string | null; addressLine2?: string | null;
  city?: string | null; country?: string | null; vatNumber?: string | null;
  tradeLicenseNo?: string | null; email?: string | null; phone?: string | null;
  website?: string | null; bankName?: string | null; accountName?: string | null;
  iban?: string | null; swift?: string | null; paymentInstructions?: string | null;
  footerNotes?: string | null; defaultTerms?: string | null;
  logoUrl?: string | null; signatureUrl?: string | null; templateConfig?: unknown;
} | null;

type CustomerLike = {
  id?: string; name: string; legalName?: string | null; email?: string | null; phone?: string | null;
  addressLine1?: string | null; addressLine2?: string | null; city?: string | null;
  country?: string | null; vatNumber?: string | null; title?: string | null;
};

type LineLike = { name: string; description?: string | null; qty: unknown; unitPrice: unknown; vatRate: unknown; discountPct: unknown; lineTotal: unknown };

type InvoiceLike = {
  number: string; issueDate: Date; dueDate?: Date | null; currency: string; status?: string;
  subtotal: unknown; discountTotal: unknown; vatTotal: unknown; total: unknown; amountPaid?: unknown;
  notes?: string | null; terms?: string | null; customer: CustomerLike; lines: LineLike[];
};

const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function metaFields(settings: SettingsLike, kind: "INVOICE" | "QUOTE") {
  const tc = (settings?.templateConfig ?? {}) as Record<string, unknown>;
  return {
    reference: str(tc.reference),
    preparedBy: str(tc.preparedBy) ?? str(tc.signatureName),
    preparedByPosition: str(tc.preparedByPosition),
    paymentMethods: str(tc.paymentMethods) ?? "Bank transfer",
    introText: str(kind === "INVOICE" ? tc.invoiceIntro : tc.quoteIntro),
    showStamp: tc.showStamp === true,
  };
}

export function buildInvoicePdfData(invoice: InvoiceLike, settings: SettingsLike, companyFallbackName: string): DocumentPdfData {
  return {
    kind: "INVOICE",
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate ?? null,
    status: invoice.status,
    currency: invoice.currency,
    company: {
      name: settings?.legalName || companyFallbackName,
      lines: [
        settings?.addressLine1, settings?.addressLine2,
        [settings?.city, settings?.country].filter(Boolean).join(", "),
        settings?.email, settings?.phone,
      ].filter((x): x is string => !!x),
      vatNumber: settings?.vatNumber, tradeLicenseNo: settings?.tradeLicenseNo, website: settings?.website,
    },
    customer: {
      name: invoice.customer.legalName || invoice.customer.name,
      lines: [
        invoice.customer.addressLine1, invoice.customer.addressLine2,
        [invoice.customer.city, invoice.customer.country].filter(Boolean).join(", "),
        invoice.customer.email,
      ].filter((x): x is string => !!x),
      vatNumber: invoice.customer.vatNumber,
    },
    lines: invoice.lines.map((l) => ({
      name: l.name, description: l.description,
      qty: num(l.qty), unitPrice: num(l.unitPrice), vatRate: num(l.vatRate),
      discountPct: num(l.discountPct), lineTotal: num(l.lineTotal),
    })),
    subtotal: num(invoice.subtotal),
    discountTotal: num(invoice.discountTotal),
    vatTotal: num(invoice.vatTotal),
    total: num(invoice.total),
    amountPaid: num(invoice.amountPaid),
    notes: invoice.notes,
    terms: invoice.terms || settings?.defaultTerms || null,
    bank: settings ? { bankName: settings.bankName, accountName: settings.accountName, iban: settings.iban, swift: settings.swift } : null,
    paymentInstructions: settings?.paymentInstructions,
    footerNotes: settings?.footerNotes,
    meta: metaFields(settings, "INVOICE"),
    ...designerFields(settings),
  };
}

function designerFields(settings: SettingsLike) {
  const tc = (settings?.templateConfig ?? {}) as Record<string, unknown>;
  const toPath = (url: string | null | undefined) => {
    if (!url || !url.startsWith("/billing/")) return null;
    return require("path").join(process.cwd(), "public", url.split("?")[0]);
  };
  const accent = (typeof tc.accentColor === "string" && tc.accentColor) || (typeof tc.accent === "string" ? tc.accent : null);
  const style = (typeof tc.templateStyle === "string" && tc.templateStyle) || (typeof tc.style === "string" ? tc.style : null);
  return {
    logoPath: toPath(settings?.logoUrl),
    signaturePath: tc.showSignature === false ? null : toPath(settings?.signatureUrl),
    signatureName: typeof tc.signatureName === "string" ? tc.signatureName : null,
    accentColor: accent,
    headerLayout: tc.headerLayout === "logo-right" ? "logo-right" as const : "logo-left" as const,
    logoSize: ["S", "M", "L"].includes(String(tc.logoSize)) ? (tc.logoSize as "S" | "M" | "L") : "M" as const,
    templateStyle: ["modern", "classic", "minimal", "bold"].includes(String(style)) ? (style as string) : "modern",
  };
}

type QuoteLike = Omit<InvoiceLike, "dueDate" | "amountPaid"> & { validUntil?: Date | null };

export function buildQuotePdfData(quote: QuoteLike, settings: SettingsLike, companyFallbackName: string): DocumentPdfData {
  const base = buildInvoicePdfData({ ...quote, dueDate: null, amountPaid: 0 }, settings, companyFallbackName);
  return { ...base, kind: "QUOTE", dueDate: null, validUntil: quote.validUntil ?? null, amountPaid: 0, meta: metaFields(settings, "QUOTE") };
}
