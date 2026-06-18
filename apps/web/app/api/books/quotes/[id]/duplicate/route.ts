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
const newId = () => "qt" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
const tok = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

/** Duplicate a quote as a fresh DRAFT (new number + share token). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId;

  const client = await pool(url).connect();
  try {
    await client.query("begin");
    const qr = await client.query(`select * from "quotes" where id = $1 and "companyId" = $2`, [params.id, cid]);
    const q = qr.rows[0];
    if (!q) { await client.query("rollback"); return NextResponse.json({ error: "Quote not found" }, { status: 404 }); }

    const yr = new Date().getFullYear(); const prefix = `QUO-${yr}-`;
    const r = await client.query(`select number from "quotes" where "companyId"=$1 and number like $2 order by number desc limit 1`, [cid, prefix + "%"]);
    let next = 1; if (r.rows[0]) { const n = parseInt(String(r.rows[0].number).slice(prefix.length), 10); if (!isNaN(n)) next = n + 1; }
    const number = prefix + String(next).padStart(5, "0");

    const id = newId();
    await client.query(
      `insert into "quotes" (id,"companyId","customerId","createdById",number,status,"issueDate","validUntil",currency,subtotal,"discountTotal","vatTotal",total,notes,terms,"publicToken","createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,'DRAFT',now(),$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())`,
      [id, cid, q.customerId, session.userId, number, q.validUntil, q.currency, q.subtotal, q.discountTotal, q.vatTotal, q.total, q.notes, q.terms, tok()]);

    const lr = await client.query(`select position, name, description, qty, "unitPrice", "vatRate", "discountPct", "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [params.id]);
    for (const l of lr.rows) {
      await client.query(`insert into "quote_lines" (id,"quoteId",position,name,description,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [newId(), id, l.position ?? 0, l.name, l.description, l.qty, l.unitPrice, l.vatRate, l.discountPct, l.lineTotal]);
    }

    await client.query("commit");
    return NextResponse.json({ id, number }, { status: 201 });
  } catch (e) {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: (e as Error).message || "Duplicate failed" }, { status: 500 });
  } finally { client.release(); }
}
