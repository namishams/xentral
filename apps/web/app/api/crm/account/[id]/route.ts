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
// eslint-disable-next-line
const safe = async (p: Promise<unknown>, d: unknown): Promise<{ rows: Record<string, unknown>[] }> => { try { return (await p) as { rows: Record<string, unknown>[] }; } catch { return d as { rows: Record<string, unknown>[] }; } };

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

/** Edit company/account fields, OR add a timeline note ({ note }). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const id = params.id; const p = pool(url);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const s = (v: unknown) => (v == null ? null : String(v));
  const newId = (pf: string) => pf + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  try {
    const own = await p.query(`select id from "accounts" where id=$1 and "companyId"=$2 limit 1`, [id, cid]);
    if (!own.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (typeof b.note === "string" && b.note.trim()) {
      await p.query(`insert into "activities" (id,"companyId","accountId",type,subject,content,"userId","createdAt","updatedAt") values ($1,$2,$3,'NOTE'::"ActivityType",'Note',$4,$5,now(),now())`,
        [newId("ac"), cid, id, b.note.trim(), session.userId]);
      return NextResponse.json({ ok: true });
    }
    // create a contact attached to this company
    if (typeof b.contactFirstName === "string" && b.contactFirstName.trim()) {
      const ctId = newId("ct");
      await p.query(`insert into "contacts" (id,"firstName","lastName",email,phone,title,"accountId","companyId","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [ctId, s(b.contactFirstName) || "Contact", s(b.contactLastName), s(b.contactEmail), s(b.contactPhone), s(b.contactTitle), id, cid]);
      return NextResponse.json({ ok: true, contactId: ctId });
    }
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of ["name", "industry", "website", "phone", "email", "city", "country", "description"]) if (f in b) {
      if (f === "name" && !String(b[f] ?? "").trim()) continue;
      sets.push(`"${f}"=$${i}`); vals.push(s(b[f])); i++;
    }
    if (!sets.length) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
    sets.push(`"updatedAt"=now()`); vals.push(id, cid);
    await p.query(`update "accounts" set ${sets.join(", ")} where id=$${i} and "companyId"=$${i + 1}`, vals);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 }); }
}
