import "server-only";
import "../../../../../lib/session";
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
const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "INVOICED"];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = pool(url);
    const q = await p.query(
      `select q.id, q.number, q.status::text as status, q.total, q.subtotal, q."vatTotal" as "vatTotal", q.currency,
              to_char(q."issueDate",'DD Mon YYYY') as issued, to_char(q."validUntil",'DD Mon YYYY') as valid, to_char(q."validUntil",'YYYY-MM-DD') as "validRaw", q.notes, q."publicToken" as token,
              bc.name as customer, bc.email as "customerEmail"
         from "quotes" q left join "billing_customers" bc on bc.id = q."customerId"
        where q.id = $1 and q."companyId" = $2 limit 1`, [params.id, session.companyId]);
    if (!q.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lines = await p.query(`select name, description, qty, "unitPrice" as "unitPrice", "lineTotal" as "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [params.id]);
    return NextResponse.json({ quote: q.rows[0], lines: lines.rows });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

/** Edit quote header: status, validUntil, notes. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  if (typeof b.status === "string" && STATUSES.includes(b.status)) { sets.push(`status = $${i}::"QuoteStatus"`); vals.push(b.status); i++; }
  if ("validUntil" in b) { sets.push(`"validUntil" = $${i}::timestamptz`); vals.push(b.validUntil ? String(b.validUntil) : null); i++; }
  if ("notes" in b) { sets.push(`notes = $${i}`); vals.push(b.notes == null ? null : String(b.notes)); i++; }
  if (sets.length === 0) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
  sets.push(`"updatedAt" = now()`);
  vals.push(params.id, session.companyId);
  try {
    const r = await pool(url).query(`update "quotes" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
    if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
