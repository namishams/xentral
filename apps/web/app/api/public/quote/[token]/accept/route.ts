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

/** Public quote decision. action = accept | reject. */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  let action = "accept";
  try { const b = await req.json(); if (b && typeof b.action === "string") action = b.action; } catch { /* default accept */ }
  const next = action === "reject" ? "REJECTED" : "ACCEPTED";
  try {
    const { rows } = await pool(url).query(
      `update "quotes" set status = $1::"QuoteStatus", "decidedAt" = now(), "updatedAt" = now()
        where "publicToken" = $2 and status in ('DRAFT','SENT') returning number`, [next, params.token]);
    if (!rows[0]) {
      const cur = await pool(url).query(`select status::text as s from "quotes" where "publicToken" = $1`, [params.token]);
      if (!cur.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, already: cur.rows[0].s });
    }
    return NextResponse.json({ ok: true, status: next });
  } catch {
    return NextResponse.json({ error: "Could not record decision" }, { status: 500 });
  }
}
