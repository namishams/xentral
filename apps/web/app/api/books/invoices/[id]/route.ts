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
    const inv = await p.query(
      `select i.id, i.number, i.status::text as status, i.total, i."amountPaid" as "amountPaid", i.subtotal, i."vatTotal" as "vatTotal", i.currency,
              to_char(i."issueDate",'DD Mon YYYY') as issued, to_char(i."dueDate",'DD Mon YYYY') as due, i.notes,
              bc.name as customer, bc.email as "customerEmail"
         from "invoices" i left join "billing_customers" bc on bc.id = i."customerId"
        where i.id = $1 and i."companyId" = $2 limit 1`, [params.id, session.companyId]);
    if (!inv.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lines = await p.query(`select name, description, qty, "unitPrice" as "unitPrice", "vatRate" as "vatRate", "lineTotal" as "lineTotal" from "invoice_lines" where "invoiceId" = $1 order by position asc`, [params.id]);
    return NextResponse.json({ invoice: inv.rows[0], lines: lines.rows });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
