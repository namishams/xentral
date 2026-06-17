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
      `select q.id, q.number, bc.name as customer, q.status::text as status, q.total, q.currency, to_char(q."validUntil",'DD Mon') as valid from "quotes" q left join "billing_customers" bc on bc.id = q."customerId" where q."companyId" = $1 order by q."createdAt" desc limit 400`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

/** Create a DRAFT quote with line items in the signed-in workspace. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const rawLines = Array.isArray(b.lines) ? (b.lines as Record<string, unknown>[]) : [];
  const lines = rawLines.filter((l) => String(l.name ?? "").trim() || Number(l.unitPrice) > 0);
  if (lines.length === 0) return NextResponse.json({ error: "Add at least one line item" }, { status: 400 });

  const client = await pool(url).connect();
  try {
    await client.query("begin");
    let customerId = String(b.customerId ?? "").trim() || null;
    const custName = String(b.customerName ?? "").trim();
    if (!customerId && custName) {
      customerId = newId();
      await client.query(`insert into "billing_customers" (id,"companyId",name,"createdAt","updatedAt") values ($1,$2,$3,now(),now())`, [customerId, session.companyId, custName]);
    }
    if (!customerId) { await client.query("rollback"); return NextResponse.json({ error: "Customer required" }, { status: 400 }); }

    let subtotal = 0, vatTotal = 0;
    const norm = lines.map((l, i) => {
      const qty = Number(l.qty) || 0, up = Number(l.unitPrice) || 0, disc = Number(l.discountPct) || 0;
      const vat = l.vatRate == null ? 5 : Number(l.vatRate);
      const net = qty * up * (1 - disc / 100); subtotal += net; vatTotal += net * vat / 100;
      return { pos: i, name: String(l.name ?? "Item") || "Item", description: l.description ? String(l.description) : null, qty, up, vat, disc, net };
    });
    const total = subtotal + vatTotal;

    const yr = new Date().getFullYear(); const prefix = `QUO-${yr}-`;
    const r = await client.query(`select number from "quotes" where "companyId"=$1 and number like $2 order by number desc limit 1`, [session.companyId, prefix + "%"]);
    let next = 1; if (r.rows[0]) { const n = parseInt(String(r.rows[0].number).slice(prefix.length), 10); if (!isNaN(n)) next = n + 1; }
    const number = prefix + String(next).padStart(5, "0");

    const id = newId();
    await client.query(
      `insert into "quotes" (id,"companyId","customerId","createdById",number,status,"issueDate","validUntil",currency,subtotal,"discountTotal","vatTotal",total,"publicToken",notes,"createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,'DRAFT',now(),$6,$7,$8,0,$9,$10,$11,$12,now(),now())`,
      [id, session.companyId, customerId, session.userId, number, b.validUntil ? String(b.validUntil) : null, String(b.currency ?? "AED"), subtotal.toFixed(2), vatTotal.toFixed(2), total.toFixed(2), newId(), b.notes ? String(b.notes) : null]);
    for (const l of norm) {
      await client.query(
        `insert into "quote_lines" (id,"quoteId",position,name,description,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [newId(), id, l.pos, l.name, l.description, l.qty, l.up, l.vat, l.disc, l.net.toFixed(2)]);
    }
    await client.query("commit");
    return NextResponse.json({ id, number }, { status: 201 });
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  } finally { client.release(); }
}
