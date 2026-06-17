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

  const c = await safe(p.query(
    `select c.id, c."firstName", c."lastName", c.title, c.email, c.phone, c."whatsApp", c.status::text as status, c.notes, c."accountId", c."avatarUrl",
            a.name as "accountName"
       from "contacts" c left join "accounts" a on a.id = c."accountId"
      where c.id = $1 and c."companyId" = $2 limit 1`, [id, cid]), { rows: [] as Record<string, unknown>[] });
  if (!c.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [tasks, leads, billing, activities, convos] = await Promise.all([
    safe(p.query(`select id, title, to_char("dueAt",'DD Mon YYYY') as due, "isCompleted" from "tasks" where "companyId"=$1 and "contactId"=$2 and "isCompleted"=false order by "dueAt" asc nulls last limit 8`, [cid, id]), { rows: [] }),
    safe(p.query(`select id, coalesce("firstName",'')||' '||coalesce("lastName",'') as name, status::text as status, value, currency, to_char("createdAt",'DD Mon YYYY') as created from "leads" where "companyId"=$1 and contact_id=$2 order by "updatedAt" desc limit 12`, [cid, id]), { rows: [] }),
    safe(p.query(`select id from "billing_customers" where "companyId"=$1 and "contactId"=$2`, [cid, id]), { rows: [] as { id: string }[] }),
    safe(p.query(`select id, type, subject, content, to_char("createdAt",'DD Mon YYYY, HH24:MI') as at from "activities" where "companyId"=$1 and "contactId"=$2 order by "createdAt" desc limit 25`, [cid, id]), { rows: [] }),
    safe(p.query(`select id, contact_phone as phone, last_message_body as body, to_char(last_message_at,'DD Mon YYYY') as at from "whatsapp_conversations" where company_id=$1 and contact_id=$2 order by last_message_at desc limit 5`, [cid, id]), { rows: [] }),
  ]);
  const custIds = (billing.rows as { id: string }[]).map((r) => r.id);
  let invoices = { rows: [] as Record<string, unknown>[] }, quotes = { rows: [] as Record<string, unknown>[] };
  if (custIds.length) {
    [invoices, quotes] = await Promise.all([
      safe(p.query(`select id, number, status::text as status, total, "amountPaid" as paid, currency from "invoices" where "companyId"=$1 and "customerId"=any($2) order by "createdAt" desc limit 12`, [cid, custIds]), { rows: [] }),
      safe(p.query(`select id, number, status::text as status, total, currency from "quotes" where "companyId"=$1 and "customerId"=any($2) order by "createdAt" desc limit 12`, [cid, custIds]), { rows: [] }),
    ]);
  }

  return NextResponse.json({
    contact: c.rows[0], tasks: tasks.rows, deals: leads.rows, invoices: invoices.rows, quotes: quotes.rows,
    activities: activities.rows, conversations: convos.rows,
  });
}

/** Edit contact fields, OR add a timeline note ({ note: "…" }), OR add a task ({ task: "…", due?: ISO }). */
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
    const own = await p.query(`select id from "contacts" where id=$1 and "companyId"=$2 limit 1`, [id, cid]);
    if (!own.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (typeof b.note === "string" && b.note.trim()) {
      await p.query(`insert into "activities" (id,"companyId","contactId",type,subject,content,"userId","createdAt","updatedAt") values ($1,$2,$3,'NOTE'::"ActivityType",'Note',$4,$5,now(),now())`,
        [newId("ac"), cid, id, b.note.trim(), session.userId]);
      return NextResponse.json({ ok: true });
    }
    if (typeof b.task === "string" && b.task.trim()) {
      await p.query(`insert into "tasks" (id,title,"dueAt","isCompleted","companyId","contactId","assignedToId","createdAt","updatedAt") values ($1,$2,${b.due ? "$3::timestamp" : "null"},false,${b.due ? "$4" : "$3"},${b.due ? "$5" : "$4"},${b.due ? "$6" : "$5"},now(),now())`,
        b.due ? [newId("tk"), b.task.trim(), s(b.due), cid, id, session.userId] : [newId("tk"), b.task.trim(), cid, id, session.userId]);
      return NextResponse.json({ ok: true });
    }
    // field edit
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of ["firstName", "lastName", "title", "email", "phone", "whatsApp", "notes"]) if (f in b) { sets.push(`"${f}"=$${i}`); vals.push(s(b[f])); i++; }
    if (!sets.length) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
    sets.push(`"updatedAt"=now()`); vals.push(id, cid);
    await p.query(`update "contacts" set ${sets.join(", ")} where id=$${i} and "companyId"=$${i + 1}`, vals);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 });
  }
}
