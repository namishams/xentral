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

/** Public invoice summary for the hosted pay page. Looks up by id (demo: no auth). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  try {
    const { rows } = await pool(url).query(
      `select i.id, i.number, i.status::text as status, i.total, i."amountPaid" as "amountPaid", i.currency,
              to_char(i."dueDate",'DD Mon YYYY') as due, bc.name as customer, co.name as merchant
         from "invoices" i
         left join "billing_customers" bc on bc.id = i."customerId"
         left join "companies" co on co.id = i."companyId"
        where i.id = $1 limit 1`, [params.id]);
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const r = rows[0];
    const balance = Math.max(0, (Number(r.total) || 0) - (Number(r.amountPaid) || 0));
    return NextResponse.json({ id: r.id, number: r.number, status: r.status, total: Number(r.total) || 0, balance, currency: r.currency || "AED", due: r.due, customer: r.customer || "Customer", merchant: r.merchant || "Xentral" });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
