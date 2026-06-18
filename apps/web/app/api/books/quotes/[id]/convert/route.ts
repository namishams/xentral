import "server-only";
import "../../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}
const newId = () => "cm" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);

/** Convert an accepted/sent quote into a DRAFT invoice (mirrors old app). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId;

  const client = await pool(url).connect();
  try {
    await client.query("begin");
    const qr = await client.query(
      `select id, "customerId", currency, notes, "invoiceId" from "quotes" where id = $1 and "companyId" = $2 for update`, [params.id, cid]);
    const quote = qr.rows[0];
    if (!quote) { await client.query("rollback"); return NextResponse.json({ error: "Quote not found" }, { status: 404 }); }
    if (quote.invoiceId) { await client.query("rollback"); return NextResponse.json({ error: "Already converted", invoiceId: quote.invoiceId }, { status: 409 }); }
    if (!quote.customerId) { await client.query("rollback"); return NextResponse.json({ error: "Quote has no customer" }, { status: 400 }); }

    const lr = await client.query(`select position, name, description, qty, "unitPrice", "vatRate", "discountPct", "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [params.id]);
    if (lr.rows.length === 0) { await client.query("rollback"); return NextResponse.json({ error: "Quote has no line items" }, { status: 400 }); }

    let subtotal = 0, vatTotal = 0;
    for (const l of lr.rows) {
      const qty = Number(l.qty) || 0, up = Number(l.unitPrice) || 0, disc = Number(l.discountPct) || 0;
      const vat = l.vatRate == null ? 5 : Number(l.vatRate);
      const net = qty * up * (1 - disc / 100); subtotal += net; vatTotal += net * vat / 100;
    }
    const total = subtotal + vatTotal;

    const yr = new Date().getFullYear(); const prefix = `INV-${yr}-`;
    const r = await client.query(`select number from "invoices" where "companyId"=$1 and number like $2 order by number desc limit 1`, [cid, prefix + "%"]);
    let next = 1; if (r.rows[0]) { const n = parseInt(String(r.rows[0].number).slice(prefix.length), 10); if (!isNaN(n)) next = n + 1; }
    const number = prefix + String(next).padStart(5, "0");

    const due = new Date(); due.setDate(due.getDate() + 30);
    const invId = newId();
    await client.query(
      `insert into "invoices" (id,"companyId","customerId","createdById",number,status,"issueDate","dueDate",currency,subtotal,"discountTotal","vatTotal",total,"amountPaid",notes,"createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,'DRAFT',now(),$6,$7,$8,0,$9,$10,0,$11,now(),now())`,
      [invId, cid, quote.customerId, session.userId, number, due.toISOString(), String(quote.currency || "AED"), subtotal.toFixed(2), vatTotal.toFixed(2), total.toFixed(2), quote.notes ? String(quote.notes) : null]);

    for (const l of lr.rows) {
      const qty = Number(l.qty) || 0, up = Number(l.unitPrice) || 0, disc = Number(l.discountPct) || 0;
      const vat = l.vatRate == null ? 5 : Number(l.vatRate);
      const net = qty * up * (1 - disc / 100);
      await client.query(
        `insert into "invoice_lines" (id,"invoiceId",position,name,description,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [newId(), invId, l.position ?? 0, String(l.name ?? "Item"), l.description ?? null, qty, up, vat, disc, net.toFixed(2)]);
    }

    await client.query(`update "quotes" set "invoiceId" = $1, status = 'ACCEPTED'::"QuoteStatus", "decidedAt" = coalesce("decidedAt", now()), "updatedAt" = now() where id = $2 and "companyId" = $3`, [invId, params.id, cid]);

    await client.query("commit");
    return NextResponse.json({ invoiceId: invId, invoiceNumber: number }, { status: 201 });
  } catch (e) {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: (e as Error).message || "Convert failed" }, { status: 500 });
  } finally { client.release(); }
}
