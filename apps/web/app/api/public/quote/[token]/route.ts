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

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  try {
    const p = pool(url);
    const q = await p.query(
      `select q.id, q.number, q.status::text as status, q.total, q.subtotal, q."vatTotal" as "vatTotal", q.currency, q.notes,
              to_char(q."validUntil",'DD Mon YYYY') as valid, bc.name as customer, co.name as merchant, bs."logoUrl" as "logoUrl", bs."templateConfig" as tpl
         from "quotes" q
         left join "billing_customers" bc on bc.id = q."customerId"
         left join "companies" co on co.id = q."companyId"
         left join "billing_settings" bs on bs."companyId" = q."companyId"
        where q."publicToken" = $1 limit 1`, [params.token]);
    if (!q.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const r = q.rows[0];
    const lines = await p.query(`select name, qty, "unitPrice" as "unitPrice", "lineTotal" as "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [r.id]);
    const accent = (r.tpl && r.tpl.accent) || "#0064d9";
    return NextResponse.json({ number: r.number, status: r.status, total: Number(r.total) || 0, subtotal: Number(r.subtotal) || 0, vatTotal: Number(r.vatTotal) || 0, currency: r.currency || "AED", valid: r.valid, customer: r.customer || "Customer", merchant: r.merchant || "Xentral", logoUrl: r.logoUrl || null, accent, notes: r.notes || null, lines: lines.rows });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
