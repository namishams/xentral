import "server-only";
import "../../../../lib/session";
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
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select j.id, to_char(j.date,'DD Mon YYYY') as date, coalesce(j.memo,'') as memo, j.source, j.status,
              coalesce((select sum(debit) from "journal_lines" jl where jl."journalId" = j.id),0) as amount
         from "journal_entries" j where j."companyId" = $1 order by j.date desc limit 400`,
      [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}
