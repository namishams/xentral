import "server-only";
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}
const newId = () => "pay" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/** Public hosted-checkout payment (Telr-style). Records the payment and marks the invoice paid. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const client = await pool(url).connect();
  try {
    await client.query("begin");
    const inv = await client.query(`select id, total, "amountPaid" from "invoices" where id = $1 for update`, [params.id]);
    if (!inv.rows[0]) { await client.query("rollback"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
    const total = Number(inv.rows[0].total) || 0;
    const due = Math.max(0, total - (Number(inv.rows[0].amountPaid) || 0));
    if (due <= 0) { await client.query("rollback"); return NextResponse.json({ ok: true, already: true }); }
    const ref = "TELR-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    await client.query(
      `insert into "payment_records" (id,"invoiceId",amount,"paidAt",method,reference,note,"createdAt") values ($1,$2,$3,now(),'CARD',$4,'Telr hosted checkout',now())`,
      [newId(), params.id, due.toFixed(2), ref]);
    await client.query(`update "invoices" set "amountPaid" = $1, status = 'PAID'::"InvoiceStatus", "paidAt" = now(), "updatedAt" = now() where id = $2`, [total.toFixed(2), params.id]);
    await client.query("commit");
    return NextResponse.json({ ok: true, reference: ref, amount: due });
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  } finally { client.release(); }
}
