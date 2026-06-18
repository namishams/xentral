import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { generateDocumentPdf } from "../../../../lib/books-pdf";
import { buildInvoicePdfData, buildQuotePdfData } from "../../../../lib/books-doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

/** Live sample PDF preview with the company's saved design (Books settings). */
export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind") === "INVOICE" ? "INVOICE" : "QUOTE";
  const cid = session.companyId; const p = pool(url);

  const settings = (await p.query(`select * from "billing_settings" where "companyId" = $1 limit 1`, [cid])).rows[0] || null;
  const company = (await p.query(`select name from "companies" where id = $1 limit 1`, [cid])).rows[0] || { name: "Xentral" };

  const sample = {
    number: kind === "INVOICE" ? `${settings?.invoicePrefix ?? "INV"}-2026-00042` : `${settings?.quotePrefix ?? "QUO"}-2026-00042`,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 86400000),
    validUntil: new Date(Date.now() + 30 * 86400000),
    currency: settings?.currency ?? "AED",
    subtotal: 6400, discountTotal: 320, vatTotal: 304, total: 6384, amountPaid: 0,
    notes: "This is a sample document — it shows how your design settings look on a real layout.",
    terms: settings?.defaultTerms ?? "Sample terms & conditions. Configure your defaults in Billing Settings.",
    customer: {
      name: "Dr. Sara Shaheen",
      legalName: null, email: "sara@example.com", phone: "+971 50 000 0000",
      addressLine1: "Healthcare City", addressLine2: null, city: "Dubai",
      country: "United Arab Emirates", vatNumber: "100000000000003",
    },
    lines: [
      { name: "Consulting Service", description: "Full scope and file preparation", qty: 1, unitPrice: 1500, vatRate: 5, discountPct: 0, lineTotal: 1575 },
      { name: "Verification", description: "Primary source verification", qty: 1, unitPrice: 900, vatRate: 5, discountPct: 0, lineTotal: 945 },
      { name: "Licensing Package", description: "End-to-end support", qty: 1, unitPrice: 4000, vatRate: 5, discountPct: 8, lineTotal: 3864 },
    ],
  };

  try {
    const data = kind === "INVOICE"
      ? buildInvoicePdfData(sample, settings, company.name ?? "Xentral")
      : buildQuotePdfData(sample, settings, company.name ?? "Xentral");
    const pdf = await generateDocumentPdf(data);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="preview-${kind.toLowerCase()}.pdf"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Preview failed" }, { status: 500 });
  }
}
