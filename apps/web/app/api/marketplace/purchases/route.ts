import "server-only";
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

/** Purchased leads for the signed-in workspace — UNLOCKED contact (the buyer paid). Empty on dormant preview. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ purchases: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select p.id, p."pricePaid", p."purchasedAt",
              l.specialty, l.category, l."originCountry", l."firstName", l."lastName", l.phone, l.email, l."linkedIn", l."yearsExperience"
         from "marketplace_purchases" p join "marketplace_leads" l on l.id = p."leadId"
        where p."companyId" = $1 order by p."purchasedAt" desc limit 300`, [session.companyId]);
    return NextResponse.json({ purchases: rows });
  } catch {
    return NextResponse.json({ purchases: [] });
  }
}
