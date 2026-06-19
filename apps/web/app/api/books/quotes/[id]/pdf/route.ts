import "server-only";
import "../../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { generateDocumentPdf } from "../../../../../../lib/books-pdf";
import { buildQuotePdfData } from "../../../../../../lib/books-doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  try {
    const qr = await p.query(
      `select q.number, q.status::text as status, q."issueDate" as "issueDate", q."validUntil" as "validUntil", q.currency,
              q.subtotal, q."discountTotal" as "discountTotal", q."vatTotal" as "vatTotal", q.total, q.notes, q.terms,
              bc.name as "cname", bc."legalName" as "clegalName", bc.email as "cemail", bc.phone as "cphone",
              bc."addressLine1" as "caddr1", bc."addressLine2" as "caddr2", bc.city as "ccity", bc.country as "ccountry", bc."vatNumber" as "cvat"
         from "quotes" q left join "billing_customers" bc on bc.id = q."customerId"
        where q.id = $1 and q."companyId" = $2 limit 1`, [params.id, cid]);
    const q = qr.rows[0];
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lines = (await p.query(`select name, description, qty, "unitPrice", "vatRate", "discountPct", "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [params.id])).rows;
    const settings = (await p.query(`select * from "billing_settings" where "companyId" = $1 limit 1`, [cid])).rows[0] || null;
    const company = (await p.query(`select name, logo, "themeAccent" from "companies" where id = $1 limit 1`, [cid])).rows[0] || { name: "Xentral" };

    const data = buildQuotePdfData({
      number: q.number, issueDate: q.issueDate, validUntil: q.validUntil, status: q.status, currency: q.currency || "AED",
      subtotal: q.subtotal, discountTotal: q.discountTotal, vatTotal: q.vatTotal, total: q.total, notes: q.notes, terms: q.terms,
      customer: { name: q.cname || "Customer", legalName: q.clegalName, email: q.cemail, phone: q.cphone, addressLine1: q.caddr1, addressLine2: q.caddr2, city: q.ccity, country: q.ccountry, vatNumber: q.cvat },
      lines,
    }, { ...(settings || {}), companyLogo: company.logo, themeAccent: company.themeAccent }, company.name || "Xentral");
    const pdf = await generateDocumentPdf(data);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${q.number}.pdf"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "PDF failed" }, { status: 500 });
  }
}
