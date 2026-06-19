import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { logAudit } from "../../../../lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}
const N = (v: unknown) => Number(v) || 0;
const OPEN = ["DRAFT", "SENT"];

/** GET — purchase orders + KPIs. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [], kpis: {} });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select po.id, po.number, po.status::text as status, po.currency, po.total,
              coalesce(s.name,'—') as supplier, to_char(po."orderDate",'DD Mon YYYY') as "orderDate",
              to_char(po."expectedDate",'DD Mon YYYY') as "expectedDate",
              (select count(*)::int from "purchase_order_lines" l where l."poId" = po.id) as items
         from "purchase_orders" po left join "suppliers" s on s.id = po."supplierId"
        where po."companyId" = $1 order by po."createdAt" desc limit 300`, [session.companyId]);
    const orders = rows.map((r) => ({ ...r, total: N(r.total) }));
    const open = orders.filter((o) => OPEN.includes(o.status));
    const kpis = {
      count: orders.length,
      openCount: open.length,
      committed: open.reduce((s, o) => s + o.total, 0),
      received: orders.filter((o) => o.status === "RECEIVED").length,
      currency: orders[0]?.currency || "AED",
    };
    return NextResponse.json({ rows: orders, kpis });
  } catch { return NextResponse.json({ rows: [], kpis: {} }); }
}

/** POST — create a purchase order with line items. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const supplierId = String(b.supplierId ?? "").trim() || null;
  const rawLines = Array.isArray(b.lines) ? b.lines as Record<string, unknown>[] : [];
  const lines = rawLines.map((l) => ({ name: String(l.name ?? "").trim(), qty: N(l.qty) || 1, unitPrice: N(l.unitPrice), vatRate: N(l.vatRate) })).filter((l) => l.name || l.unitPrice > 0);
  if (!supplierId && !String(b.supplierName ?? "").trim()) return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
  if (lines.length === 0) return NextResponse.json({ error: "Add at least one line" }, { status: 400 });

  const p = pool(url); const client = await p.connect();
  try {
    await client.query("BEGIN");
    let sid = supplierId;
    if (!sid) {
      sid = randomUUID();
      await client.query(`insert into "suppliers" (id,"companyId",name,active,"createdAt") values ($1,$2,$3,true,now())`, [sid, session.companyId, String(b.supplierName).trim()]);
    }
    const yr = new Date().getFullYear(); const prefix = `PO-${yr}-`;
    const last = (await client.query(`select number from "purchase_orders" where "companyId"=$1 and number like $2 order by number desc limit 1`, [session.companyId, prefix + "%"])).rows[0];
    let next = 1; if (last?.number) { const n = parseInt(String(last.number).slice(prefix.length), 10); if (!isNaN(n)) next = n + 1; }
    const number = prefix + String(next).padStart(5, "0");
    let subtotal = 0, vatTotal = 0;
    for (const l of lines) { const net = l.qty * l.unitPrice; subtotal += net; vatTotal += net * l.vatRate / 100; }
    const total = subtotal + vatTotal;
    const id = randomUUID();
    await client.query(
      `insert into "purchase_orders" (id,"companyId",number,"supplierId",status,currency,subtotal,"vatTotal",total,"orderDate","expectedDate",notes,"createdAt","updatedAt")
       values ($1,$2,$3,$4,'DRAFT',$5,$6,$7,$8,$9,$10,$11,now(),now())`,
      [id, session.companyId, number, sid, String(b.currency ?? "AED"), subtotal.toFixed(2), vatTotal.toFixed(2), total.toFixed(2),
        b.orderDate ? String(b.orderDate) : null, b.expectedDate ? String(b.expectedDate) : null, b.notes ? String(b.notes) : null]);
    let pos = 0;
    for (const l of lines) { const net = l.qty * l.unitPrice * (1 + l.vatRate / 100); await client.query(`insert into "purchase_order_lines" (id,"poId",position,name,qty,"unitPrice","vatRate","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8)`, [randomUUID(), id, pos++, l.name, l.qty, l.unitPrice, l.vatRate, net.toFixed(2)]); }
    await client.query("COMMIT");
    await logAudit("purchase_order.create", { targetType: "purchase_order", targetId: id, meta: { number, total } });
    return NextResponse.json({ ok: true, id, number });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* noop */ }
    return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 });
  } finally { client.release(); }
}
