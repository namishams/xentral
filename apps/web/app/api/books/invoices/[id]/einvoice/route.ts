import "server-only";
import "../../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { buildPintAeXml, validatePintAe, xmlHash, type EInvInput } from "../../../../../../lib/books/einvoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

async function loadInput(p: Pool, invoiceId: string, companyId: string): Promise<EInvInput | null> {
  const ir = await p.query(
    `select i.number, i."issueDate" as "issueDate", i."dueDate" as "dueDate", i.currency, i.subtotal, i."discountTotal" as "discountTotal", i."vatTotal" as "vatTotal", i.total,
            bc.name as "cname", bc."legalName" as "clegalName", bc."vatNumber" as "cvat", bc."addressLine1" as "caddr1", bc.city as "ccity", bc.country as "ccountry"
       from "invoices" i left join "billing_customers" bc on bc.id = i."customerId"
      where i.id = $1 and i."companyId" = $2 limit 1`, [invoiceId, companyId]);
  const inv = ir.rows[0];
  if (!inv) return null;
  const s = (await p.query(`select "legalName","vatNumber","addressLine1",city,country from "billing_settings" where "companyId" = $1`, [companyId])).rows[0] || {};
  const lines = (await p.query(`select name, description, qty, "unitPrice", "vatRate", "discountPct", "lineTotal" from "invoice_lines" where "invoiceId" = $1 order by position asc`, [invoiceId])).rows;
  return {
    number: inv.number, issueDate: inv.issueDate, dueDate: inv.dueDate, currency: inv.currency,
    subtotal: inv.subtotal, discountTotal: inv.discountTotal, vatTotal: inv.vatTotal, total: inv.total,
    supplier: { name: s.legalName || "", trn: s.vatNumber || null, addressLine1: s.addressLine1 || null, city: s.city || null, country: s.country || "United Arab Emirates" },
    customer: { name: inv.clegalName || inv.cname || "", trn: inv.cvat || null, addressLine1: inv.caddr1 || null, city: inv.ccity || null, country: inv.ccountry || null },
    lines: lines.map((l) => ({ name: l.name, description: l.description, qty: l.qty, unitPrice: l.unitPrice, vatRate: l.vatRate, discountPct: l.discountPct, lineTotal: l.lineTotal })),
  };
}

/** GET — download the generated PINT-AE XML for an invoice. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await loadInput(pool(url), params.id, session.companyId);
  if (!input) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const errs = validatePintAe(input);
  if (errs.length) return NextResponse.json({ ok: false, status: "invalid", errors: errs }, { status: 422 });
  const xml = buildPintAeXml(input);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="einvoice-${input.number}.xml"` },
  });
}

/** POST — generate + validate, return errors[] or hash (no transmission). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await loadInput(pool(url), params.id, session.companyId);
  if (!input) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const errors = validatePintAe(input);
  if (errors.length) return NextResponse.json({ ok: false, status: "invalid", errors }, { status: 200 });
  const xml = buildPintAeXml(input);
  return NextResponse.json({ ok: true, status: "validated", hash: xmlHash(xml) });
}
