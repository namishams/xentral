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
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select p.id, p.reference as ref, p.amount, p.method, to_char(p."paidAt",'DD Mon') as date, i.customer, i.number as "invoiceNo"
         from "payment_records" p join "invoices" i on i.id = p."invoiceId"
        where i."companyId" = $1 order by p."paidAt" desc limit 400`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}
