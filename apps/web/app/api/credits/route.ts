import "server-only";
import "../../../lib/session"; // side-effect: register SessionPort resolver
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

/** Credit balance for the signed-in workspace. Mirrors the old app's /api/credits. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ balance: 0 });
  const session = await resolveSession();
  if (!session?.companyId) return NextResponse.json({ balance: 0 });
  try {
    const { rows } = await pool(url).query(`select coalesce(credits,0)::int as credits from "companies" where id = $1`, [session.companyId]);
    return NextResponse.json({ balance: rows[0]?.credits ?? 0 });
  } catch { return NextResponse.json({ balance: 0 }); }
}
