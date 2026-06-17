import "server-only";
import "../../../../../lib/session";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

/** Toggle a lead in the company watchlist. Returns the new state. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = pool(url); const leadId = params.id; const cid = session.companyId;
  try {
    const ex = await p.query(`select id from "lead_watchlist" where "leadId" = $1 and "companyId" = $2 limit 1`, [leadId, cid]);
    if (ex.rowCount) {
      await p.query(`delete from "lead_watchlist" where "leadId" = $1 and "companyId" = $2`, [leadId, cid]);
      await p.query(`update "marketplace_leads" set "watchCount" = greatest(0, "watchCount" - 1) where id = $1`, [leadId]).catch(() => {});
      return NextResponse.json({ watched: false });
    }
    await p.query(`insert into "lead_watchlist" (id, "leadId", "companyId", "createdAt") values ($1,$2,$3, now())`, [randomUUID(), leadId, cid]);
    await p.query(`update "marketplace_leads" set "watchCount" = "watchCount" + 1 where id = $1`, [leadId]).catch(() => {});
    return NextResponse.json({ watched: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
