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
const safe = async (p: Promise<any>, d: any): Promise<any> => { try { return await p; } catch { return d; } };

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const id = params.id; const p = pool(url);

  const a = await safe(p.query(
    `select id, name, industry, website, phone, email, city, country, description, "logoUrl"
       from "accounts" where id=$1 and "companyId"=$2 limit 1`, [id, cid]), { rows: [] as Record<string, unknown>[] });
  if (!a.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [contacts, leads, billing, activities] = await Promise.all([
    safe(p.query(`select id, coalesce("firstName",'')||' '||coalesce("lastName",'') as name, title, email, phone from "contacts" where "companyId"=$1 and "accountId"=$2 order by "updatedAt" desc limit 50`, [cid, id]), { rows: [] }),
    safe(p.query(`select id, coalesce("firstName",'')||' '||coalesce("lastName",'') as name, status::text as status, value, currency from "leads" where "companyId"=$1 and "accountId"=$2 order by "updatedAt" desc limit 12`, [cid, id]), { rows: [] }),
    safe(p.query(`select id from "billing_customers" where "companyId"=$1 and "accountId"=$2`, [cid, id]), { rows: [] as { id: string }[] }),
    safe(p.query(`select id, type, subject, content, to_char("createdAt",'DD Mon YYYY, HH24:MI') as at from "activities" where "companyId"=$1 and "accountId"=$2 order by "createdAt" desc limit 25`, [cid, id]), { rows: [] }),
  ]);
  const custIds = (billing.rows as { id: string }[]).map((r) => r.id);
  let invoices = { rows: [] as Record<string, unknown>[] }, quotes = { rows: [] as Record<string, unknown>[] };
  if (custIds.length) {
    [invoices, quotes] = await Promise.all([
      safe(p.query(`select id, number, status::text as status, total, "amountPaid" as paid, currency from "invoices" where "companyId"=$1 and "customerId"=any($2) order by "createdAt" desc limit 12`, [cid, custIds]), { rows: [] }),
      safe(p.query(`select id, number, status::text as status, total, currency from "quotes" where "companyId"=$1 and "customerId"=any($2) order by "createdAt" desc limit 12`, [cid, custIds]), { rows: [] }),
    ]);
  }
  return NextResponse.json({ account: a.rows[0], contacts: contacts.rows, deals: leads.rows, invoices: invoices.rows, quotes: quotes.rows, activities: activities.rows });
}
