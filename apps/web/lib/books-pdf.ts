import PDFDocument from "pdfkit";

/**
 * Xentral Books — modern UAE corporate document engine (English).
 * Premium SaaS layout in the Xentral design language: navy/slate/soft-grey/white,
 * document-type badge, From / Bill To, summary card, alternating-row table,
 * payment card with QR placeholder, and an optional signature block.
 */

const INK = "#33373d";        // primary — dark grey, not black
const SLATE = "#5c636d";      // secondary
const MUTED = "#9099a3";      // meta
const FAINT = "#aab4c0";      // very soft
const LINE = "#e3e6ea";       // dividers
const LINE_SOFT = "#eef0f3";
const NAVY = "#33373d";       // (kept name) → dark grey for headings
const BLUE = "#0064d9";       // brand accent
const CARD = "#f4f6fb";       // summary / payment card bg
const ROWALT = "#f7f9fd";     // alternating row

/** Blend a hex colour toward white by `amt` (0..1). */
function lighten(hex: string, amt: number): string {
  const h = (hex || "#0064d9").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.round(v + (255 - v) * amt).toString(16).padStart(2, "0");
  return `#${m(r)}${m(g)}${m(b)}`;
}

const PAGE_W = 595.28, PAGE_H = 841.89;
const M = 56;
const W = PAGE_W - M * 2;

export type PdfParty = { name: string; lines: string[]; vatNumber?: string | null };
export type PdfLine = { name: string; description?: string | null; qty: number; unitPrice: number; vatRate: number; discountPct: number; lineTotal: number };

export type DocumentPdfData = {
  kind: "INVOICE" | "QUOTE";
  number: string;
  issueDate: Date;
  dueDate?: Date | null;
  validUntil?: Date | null;
  status?: string;
  currency: string;
  company: PdfParty & { tradeLicenseNo?: string | null; website?: string | null };
  customer: PdfParty;
  lines: PdfLine[];
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  total: number;
  amountPaid?: number;
  notes?: string | null;
  terms?: string | null;
  bank?: { bankName?: string | null; accountName?: string | null; iban?: string | null; swift?: string | null } | null;
  paymentInstructions?: string | null;
  footerNotes?: string | null;
  logoPath?: string | null;
  signaturePath?: string | null;
  signatureName?: string | null;
  accentColor?: string | null;
  templateStyle?: string | null;
  headerLayout?: "logo-left" | "logo-right" | null;
  logoSize?: "S" | "M" | "L" | null;
  /** modern doc meta (English) */
  meta?: {
    reference?: string | null;
    preparedBy?: string | null;
    preparedByPosition?: string | null;
    paymentMethods?: string | null;
    introText?: string | null;
    showStamp?: boolean;
  } | null;
};

const money = (n: number, cur: string) => `${cur} ${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qtyFmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toLocaleString("en-US", { maximumFractionDigits: 2 }));
const fdate = (d: Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const STATUS_TONE: Record<string, string> = { PAID: "#188918", SENT: "#0064d9", VIEWED: "#0064d9", ACCEPTED: "#188918", PARTIALLY_PAID: "#b25d00", OVERDUE: "#b3261e", REJECTED: "#b3261e", EXPIRED: "#b3261e", DRAFT: "#647082" };

export function generateDocumentPdf(data: DocumentPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margins: { top: M, bottom: M, left: M, right: M } });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const accent = /^#[0-9a-fA-F]{6}$/.test(data.accentColor || "") ? (data.accentColor as string) : BLUE;
      const accentTint = lighten(accent, 0.90);
      const tplStyle = ["modern", "classic", "minimal", "bold"].includes(String(data.templateStyle)) ? String(data.templateStyle) : "modern";
      const topBar = tplStyle === "bold";
      const accentHead = tplStyle === "bold" || tplStyle === "classic";
      const solidTotal = tplStyle === "bold";
      const plainTotal = tplStyle === "minimal";
      const meta = data.meta ?? {};
      const isInvoice = data.kind === "INVOICE";
      const docWord = isInvoice ? "Invoice" : "Quotation";

      if (topBar) doc.rect(0, 0, PAGE_W, 9).fill(accent);

      // ── HEADER: logo/name (left) · type + number (right) ──
      let leftBottom = M + 4;
      if (data.logoPath) {
        try { const h = data.logoSize === "L" ? 54 : data.logoSize === "S" ? 34 : 44; doc.image(data.logoPath, M, M + 6, { fit: [180, h] }); leftBottom = M + 6 + h; }
        catch { /* logo optional */ }
      } else {
        doc.font("Helvetica-Bold").fontSize(21).fillColor(INK).text(data.company.name, M, M + 10, { width: W * 0.55 });
        leftBottom = doc.y;
        if (data.company.website) { doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(data.company.website, M, leftBottom + 1); leftBottom = doc.y; }
      }

      // right: document type eyebrow (accent) + number
      const by = M + 12;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(accent).text(docWord.toUpperCase(), M + W - 220, by, { width: 220, align: "right", characterSpacing: 2 });
      doc.font("Helvetica-Bold").fontSize(17).fillColor(INK).text(data.number, M + W - 220, by + 13, { width: 220, align: "right" });
      let rightBottom = by + 35;
      if (data.status) {
        const st = data.status.replace(/_/g, " ");
        const tone = STATUS_TONE[data.status] ?? SLATE;
        doc.font("Helvetica-Bold").fontSize(8).fillColor(tone).text(st.toUpperCase(), M + W - 220, rightBottom, { width: 220, align: "right", characterSpacing: 0.5 });
        rightBottom += 13;
      }

      let y = Math.max(leftBottom, rightBottom) + 16;
      doc.moveTo(M, y).lineTo(M + W, y).strokeColor(LINE).lineWidth(0.8).stroke();
      y += 16;

      // ── FROM / BILL TO ──
      const colW = W * 0.46, rightX = M + W * 0.52;
      const partyBlock = (x: number, label: string, p: PdfParty, extra?: string | null) => {
        let yy = y;
        doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text(label, x, yy, { characterSpacing: 1 }); yy += 13;
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(INK).text(p.name, x, yy, { width: colW }); yy = doc.y + 1;
        doc.font("Helvetica").fontSize(9).fillColor(SLATE);
        for (const ln of p.lines.filter(Boolean)) { doc.text(ln, x, yy, { width: colW }); yy = doc.y; }
        if (p.vatNumber) { doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(`TRN ${p.vatNumber}`, x, yy + 1); yy = doc.y; }
        if (extra) { doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(extra, x, yy); yy = doc.y; }
        return yy;
      };
      const fromBottom = partyBlock(M, "FROM", data.company, data.company.tradeLicenseNo ? `License ${data.company.tradeLicenseNo}` : null);
      const toBottom = partyBlock(rightX, isInvoice ? "BILL TO" : "PREPARED FOR", data.customer);
      y = Math.max(fromBottom, toBottom) + 16;

      // ── DETAIL STRIP (issue / valid / reference / prepared by) ──
      const cells: [string, string][] = [["Issue Date", fdate(data.issueDate)]];
      if (isInvoice && data.dueDate) cells.push(["Due Date", fdate(data.dueDate)]);
      if (!isInvoice && data.validUntil) cells.push(["Valid Until", fdate(data.validUntil)]);
      if (meta.reference) cells.push(["Reference", meta.reference]);
      if (meta.preparedBy) cells.push(["Prepared By", meta.preparedBy]);
      const stripH = 38;
      doc.moveTo(M, y).lineTo(M + W, y).strokeColor(LINE_SOFT).lineWidth(0.8).stroke();
      doc.moveTo(M, y + stripH).lineTo(M + W, y + stripH).strokeColor(LINE_SOFT).lineWidth(0.8).stroke();
      const cw = W / Math.max(cells.length, 1);
      cells.forEach(([k, v], i) => {
        const cx = M + cw * i + 14;
        doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(k.toUpperCase(), cx, y + 8, { width: cw - 20, characterSpacing: 0.4 });
        doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(v, cx, y + 19, { width: cw - 20 });
      });
      y += stripH + 18;

      if (meta.introText) { doc.font("Helvetica").fontSize(9.5).fillColor(SLATE).text(meta.introText, M, y, { width: W }); y = doc.y + 14; }

      // ── ITEM TABLE ──
      const qtyR = M + W * 0.60, unitR = M + W * 0.80, amtR = M + W, descX = M + 24;
      if (accentHead) doc.roundedRect(M, y - 3, W, 21, 4).fill(accent);
      const headColor = accentHead ? "#ffffff" : MUTED;
      const headY = accentHead ? y + 3 : y;
      const hashX = accentHead ? M + 6 : M;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(headColor);
      doc.text("#", hashX, headY, { width: 18 });
      doc.text("DESCRIPTION", descX, headY, { width: qtyR - descX - 60 });
      doc.text("QTY", qtyR - 90, headY, { width: 90, align: "right" });
      doc.text("UNIT PRICE", unitR - 110, headY, { width: 110, align: "right" });
      doc.text("AMOUNT", amtR - 96, headY, { width: 90, align: "right" });
      if (accentHead) {
        y = y - 3 + 21 + 4;
      } else {
        y = doc.y + 5;
        doc.moveTo(M, y).lineTo(M + W, y).strokeColor(LINE).lineWidth(1).stroke();
        y += 2;
      }

      data.lines.forEach((l, i) => {
        const top = y + 6;
        // measure desc height
        doc.font("Helvetica-Bold").fontSize(9.5);
        const nameH = doc.heightOfString(l.name, { width: qtyR - descX - 70 });
        let descH = 0;
        if (l.description) { doc.font("Helvetica").fontSize(8); descH = doc.heightOfString(l.description, { width: qtyR - descX - 70 }) + 2; }
        const rowH = Math.max(26, nameH + descH + 12);
        doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`${i + 1}`, M, top, { width: 18 });
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(l.name, descX, top, { width: qtyR - descX - 70 });
        if (l.description) doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(l.description, descX, doc.y + 1, { width: qtyR - descX - 70 });
        doc.font("Helvetica").fontSize(9.5).fillColor(SLATE);
        doc.text(qtyFmt(l.qty), qtyR - 90, top, { width: 90, align: "right" });
        doc.text(money(l.unitPrice, data.currency), unitR - 110, top, { width: 110, align: "right" });
        doc.font("Helvetica-Bold").fillColor(INK).text(money(l.lineTotal, data.currency), amtR - 90, top, { width: 90, align: "right" });
        y += rowH;
        doc.moveTo(M, y).lineTo(M + W, y).strokeColor(LINE_SOFT).lineWidth(0.6).stroke();
      });
      y += 18;

      // ── SUMMARY CARD (right) ──
      const cardW = 250, cardX = M + W - cardW;
      const rows: [string, string, boolean][] = [["Subtotal", money(data.subtotal, data.currency), false]];
      if (data.discountTotal > 0) rows.push(["Discount", `- ${money(data.discountTotal, data.currency)}`, false]);
      const rate = data.lines.find((l) => l.vatRate > 0)?.vatRate ?? 0;
      rows.push([`VAT${rate ? ` (${qtyFmt(rate)}%)` : ""}`, money(data.vatTotal, data.currency), false]);
      // clean style: no filled card — thin rule above the totals, plain text rows
      doc.moveTo(cardX, y).lineTo(cardX + cardW, y).strokeColor(LINE).lineWidth(0.8).stroke();
      let cy = y + 12;
      for (const [k, v] of rows) {
        doc.font("Helvetica").fontSize(9.5).fillColor(SLATE).text(k, cardX + 2, cy, { width: cardW * 0.5 });
        doc.font("Helvetica").fontSize(9.5).fillColor(INK).text(v, cardX + cardW * 0.45, cy, { width: cardW * 0.55 - 2, align: "right" });
        cy += 17;
      }
      cy += 8;
      if (solidTotal) doc.roundedRect(cardX, cy, cardW, 36, 7).fill(accent);
      else if (!plainTotal) doc.roundedRect(cardX, cy, cardW, 36, 7).fill(accentTint);
      else doc.moveTo(cardX, cy).lineTo(cardX + cardW, cy).strokeColor(accent).lineWidth(1.4).stroke();
      const totLabel = solidTotal ? "#ffffff" : (plainTotal ? INK : accent);
      const totValue = solidTotal ? "#ffffff" : accent;
      const totY = plainTotal ? cy + 9 : cy + 12;
      const totPad = plainTotal ? 2 : 14;
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(totLabel).text(isInvoice ? "Total Due" : "Total", cardX + totPad, totY, { width: cardW * 0.42 });
      doc.font("Helvetica-Bold").fontSize(15).fillColor(totValue).text(money(data.total, data.currency), cardX + cardW * 0.42, totY - 2, { width: cardW * 0.58 - totPad, align: "right" });
      const summaryBottom = cy + 36;
      if (isInvoice && (data.amountPaid ?? 0) > 0) {
        doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(`Paid ${money(data.amountPaid!, data.currency)} · Balance ${money(data.total - (data.amountPaid ?? 0), data.currency)}`, cardX, summaryBottom + 5, { width: cardW, align: "right" });
      }

      // ── PAYMENT CARD (left, beside summary) ──
      const payW = W - cardW - 20;
      const bank = data.bank;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text(isInvoice ? "PAYMENT DETAILS" : "NOTES", M, y, { characterSpacing: 1 });
      let py = y + 14;
      if (isInvoice) {
        const pay: [string, string][] = [];
        if (bank?.accountName) pay.push(["Account Name", bank.accountName]);
        if (bank?.bankName) pay.push(["Bank", bank.bankName]);
        if (bank?.iban) pay.push(["IBAN", bank.iban]);
        if (bank?.swift) pay.push(["SWIFT", bank.swift]);
        doc.font("Helvetica").fontSize(9);
        for (const [k, v] of pay) {
          doc.fillColor(MUTED).text(k, M, py, { width: 70, continued: false });
          doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(v, M + 76, py, { width: payW - 76 });
          doc.font("Helvetica").fontSize(9); py = doc.y + 3;
        }
        if (meta.paymentMethods) { doc.fillColor(MUTED).fontSize(8.5).text(`Methods: ${meta.paymentMethods}`, M, py + 1, { width: payW }); py = doc.y; }
        // QR placeholder
        const qrY = Math.max(py + 6, y + 14);
        const qs = 54, qx = M;
        doc.roundedRect(qx, qrY, qs, qs, 6).lineWidth(0.8).strokeColor(LINE).stroke();
        // simple QR-like corner marks
        doc.fillColor(FAINT);
        [[qx + 8, qrY + 8], [qx + qs - 20, qrY + 8], [qx + 8, qrY + qs - 20]].forEach((__p) => { const mx = __p[0] as number, my = __p[1] as number; doc.rect(mx, my, 12, 12).fill(FAINT); doc.rect(mx + 3, my + 3, 6, 6).fill("#ffffff"); doc.fillColor(FAINT); });
        doc.rect(qx + qs / 2 - 2, qrY + qs / 2 - 2, 4, 4).fill(FAINT);
        doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("Scan to pay", qx + qs + 8, qrY + qs / 2 - 5, { width: payW - qs - 8 });
        py = qrY + qs + 6;
      } else if (meta.introText || data.notes) {
        doc.font("Helvetica").fontSize(9).fillColor(SLATE).text(data.notes || "Thank you for the opportunity. We look forward to working with you.", M, py, { width: payW });
        py = doc.y;
      }

      y = Math.max(summaryBottom + (isInvoice && (data.amountPaid ?? 0) > 0 ? 18 : 14), py + 8);

      // ── TERMS ──
      const termsText = data.terms || meta.introText || (isInvoice ? "Payment is due by the date above. Please reference the invoice number with your transfer." : "This quotation is valid until the date above. Prices are exclusive of any third-party fees unless stated.");
      if (termsText) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("TERMS", M, y, { characterSpacing: 1 });
        doc.font("Helvetica").fontSize(8.5).fillColor(SLATE).text(termsText, M, y + 12, { width: W * 0.62 });
      }

      // ── SIGNATURE (right) ──
      if (meta.preparedBy || data.signaturePath || meta.showStamp) {
        const sx = M + W - 200, sigY = y + 2;
        if (data.signaturePath) { try { doc.image(data.signaturePath, sx, sigY, { fit: [150, 38] }); } catch { /* skip */ } }
        doc.moveTo(sx, sigY + 44).lineTo(sx + 180, sigY + 44).strokeColor(LINE).lineWidth(0.8).stroke();
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(meta.preparedBy || data.signatureName || data.company.name, sx, sigY + 49, { width: 180 });
        if (meta.preparedByPosition) doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(meta.preparedByPosition, sx, doc.y, { width: 180 });
      }

      // ── FOOTER ──
      const fy = PAGE_H - M - 22;
      doc.moveTo(M, fy).lineTo(M + W, fy).strokeColor(LINE_SOFT).lineWidth(0.6).stroke();
      doc.font("Helvetica").fontSize(8).fillColor(MUTED);
      doc.text(data.footerNotes || `${data.company.name}${data.company.website ? " · " + data.company.website : ""}`, M, fy + 7, { width: W * 0.7 });
      doc.text("Page 1 of 1", M, fy + 7, { width: W, align: "right" });

      doc.end();
    } catch (err) { reject(err); }
  });
}
