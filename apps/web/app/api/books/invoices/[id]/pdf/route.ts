import "server-only";
import "../../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { generateDocumentPdf } from "../../../../../../lib/books-pdf";
import { buildInvoicePdfData } from "../../../../../../lib/books-doc";

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
    const ir = await p.query(
      `select i.number, i.status::text as status, i."issueDate" as "issueDate", i."dueDate" as "dueDate", i.currency,
              i.subtotal, i."discountTotal" as "discountTotal", i."vatTotal" as "vatTotal", i.total, i."amountPaid" as "amountPaid", i.notes, i.terms,
              bc.name as "cname", bc."legalName" as "clegalName", bc.email as "cemail", bc.phone as "cphone",
              bc."addressLine1" as "caddr1", bc."addressLine2" as "caddr2", bc.city as "ccity", bc.country as "ccountry", bc."vatNumber" as "cvat"
         from "invoices" i left join "billing_customers" bc on bc.id = i."customerId"
        where i.id = $1 and i."companyId" = $2 limit 1`, [params.id, cid]);
    const inv = ir.rows[0];
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lines = (await p.query(`select name, description, qty, "unitPrice", "vatRate", "discountPct", "lineTotal" from "invoice_lines" where "invoiceId" = $1 order by position asc`, [params.id])).rows;
    const settings = (await p.query(`select * from "billing_settings" where "companyId" = $1 limit 1`, [cid])).rows[0] || null;
    const company = (await p.query(`select name from "companies" where id = $1 limit 1`, [cid])).rows[0] || { name: "Xentral" };

    const data = buildInvoicePdfData({
      number: inv.number, issueDate: inv.issueDate, dueDate: inv.dueDate, status: inv.status, currency: inv.currency || "AED",
      subtotal: inv.subtotal, discountTotal: inv.discountTotal, vatTotal: inv.vatTotal, total: inv.total, amountPaid: inv.amountPaid, notes: inv.notes, terms: inv.terms,
      customer: { name: inv.cname || "Customer", legalName: inv.clegalName, email: inv.cemail, phone: inv.cphone, addressLine1: inv.caddr1, addressLine2: inv.caddr2, city: inv.ccity, country: inv.ccountry, vatNumber: inv.cvat },
      lines,
    }, settings, company.name || "Xentral");
    const pdf = await generateDocumentPdf(data);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${inv.number}.pdf"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "PDF failed" }, { status: 500 });
  }
}
