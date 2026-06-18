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

/** Billing customers for the customer picker. Empty on the dormant preview. */
export async function GET(req: Request) {
  const wantStats = new URL(req.url).searchParams.get("stats") === "1";

  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (wantStats) {
      const { rows } = await pool(url).query(
        `select c.id, c.name, c.email, count(i.id)::int as "invoiceCount",
                coalesce(sum(case when i.status::text in ('SENT','PARTIALLY_PAID','OVERDUE') then (i.total - i."amountPaid") else 0 end),0) as outstanding,
                coalesce(max(i.currency),'AED') as currency
           from "billing_customers" c left join "invoices" i on i.id is not null and i."customerId" = c.id and i."companyId" = $1
          where c."companyId" = $1 group by c.id, c.name, c.email order by outstanding desc, c.name asc limit 1000`, [session.companyId]);
      return NextResponse.json({ rows: rows.map((r) => ({ ...r, outstanding: Number(r.outstanding) || 0 })) });
    }
    const { rows } = await pool(url).query(
      `select id, name, email from "billing_customers" where "companyId" = $1 order by name asc limit 1000`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}
