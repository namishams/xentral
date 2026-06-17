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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = pool(url);
    const q = await p.query(
      `select q.id, q.number, q.status::text as status, q.total, q.subtotal, q."vatTotal" as "vatTotal", q.currency,
              to_char(q."issueDate",'DD Mon YYYY') as issued, to_char(q."validUntil",'DD Mon YYYY') as valid, q.notes, q."publicToken" as token,
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
