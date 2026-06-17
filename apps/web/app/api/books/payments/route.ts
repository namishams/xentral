import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
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

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select p.id, p.reference as ref, p.amount, p.method, to_char(p."paidAt",'DD Mon') as date, bc.name as customer, i.number as "invoiceNo" from "payment_records" p join "invoices" i on i.id = p."invoiceId" left join "billing_customers" bc on bc.id = i."customerId" where i."companyId" = $1 order by p."paidAt" desc limit 400`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

/** Record a payment against an invoice and update its paid amount + status. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const invoiceId = String(b.invoiceId ?? "").trim();
  const amount = Number(b.amount);
  if (!invoiceId) return NextResponse.json({ error: "Invoice required" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });

  const client = await pool(url).connect();
  try {
    await client.query("begin");
    const inv = await client.query(`select id, total from "invoices" where id = $1 and "companyId" = $2 for update`, [invoiceId, session.companyId]);
    if (!inv.rows[0]) { await client.query("rollback"); return NextResponse.json({ error: "Invoice not found" }, { status: 404 }); }
    const total = Number(inv.rows[0].total) || 0;
    await client.query(
      `insert into "payment_records" (id,"invoiceId",amount,"paidAt",method,reference,note,"createdAt") values ($1,$2,$3,$4,$5,$6,$7,now())`,
      [newId(), invoiceId, amount.toFixed(2), b.paidAt ? String(b.paidAt) : new Date().toISOString(), String(b.method ?? "BANK_TRANSFER") || "BANK_TRANSFER", b.reference ? String(b.reference) : null, b.note ? String(b.note) : null]);
    const sumRes = await client.query(`select coalesce(sum(amount),0) as paid from "payment_records" where "invoiceId" = $1`, [invoiceId]);
    const paid = Number(sumRes.rows[0].paid) || 0;
    const status = paid >= total && total > 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : null;
    if (status) await client.query(`update "invoices" set "amountPaid" = $1, status = $2::"InvoiceStatus", "paidAt" = case when $2='PAID' then now() else "paidAt" end, "updatedAt" = now() where id = $3`, [paid.toFixed(2), status, invoiceId]);
    else await client.query(`update "invoices" set "amountPaid" = $1, "updatedAt" = now() where id = $2`, [paid.toFixed(2), invoiceId]);
    await client.query("commit");
    return NextResponse.json({ ok: true, amountPaid: paid, status }, { status: 201 });
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: "Could not record payment" }, { status: 500 });
  } finally { client.release(); }
}
