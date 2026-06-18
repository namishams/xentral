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
    `select c.id, c."firstName", c."lastName", c.title, c.email, c.phone, c."whatsApp", c.status::text as status, c.notes, c."accountId", c."avatarUrl", c."leadSource" as "leadSource", c."assignedToId" as "assignedToId", c.salutation, c."addressLine1" as "addressLine1", c.city, c.country, c.website, c.instagram, c."linkedIn" as "linkedIn", c."contactKind" as "contactKind",
            a.name as "accountName", au.name as "assignedToName"
       from "contacts" c left join "accounts" a on a.id = c."accountId" left join "users" au on au.id = c."assignedToId"
      where c.id = $1 and c."companyId" = $2 limit 1`, [id, cid]), { rows: [] as Record<string, unknown>[] });
  if (!c.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [tasks, leads, billing, activities, convos] = await Promise.all([
    safe(p.query(`select id, title, to_char("dueAt",'DD Mon YYYY') as due, "isCompleted" from "tasks" where "companyId"=$1 and "contactId"=$2 and "isCompleted"=false order by "dueAt" asc nulls last limit 8`, [cid, id]), { rows: [] }),
    safe(p.query(`select id, coalesce("firstName",'')||' '||coalesce("lastName",'') as name, status::text as status, value, currency, to_char("createdAt",'DD Mon YYYY') as created from "leads" where "companyId"=$1 and contact_id=$2 order by "updatedAt" desc limit 12`, [cid, id]), { rows: [] }),
    safe(p.query(`select id from "billing_customers" where "companyId"=$1 and "contactId"=$2`, [cid, id]), { rows: [] as { id: string }[] }),
    safe(p.query(`select a.id, a.type::text as type, a.subject, a.content, a.direction, a.outcome, to_char(a."createdAt",'DD Mon YYYY, HH24:MI') as at, au.name as author from "activities" a left join "users" au on au.id = a."userId" where a."companyId"=$1 and a."contactId"=$2 order by a."createdAt" desc limit 40`, [cid, id]), { rows: [] }),
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
      const T = ["NOTE","CALL","EMAIL","MEETING","FOLLOW_UP"].includes(String(b.activityType)) ? String(b.activityType) : "NOTE";
      const subj = ({ NOTE: "Note", CALL: "Call logged", EMAIL: "Email logged", MEETING: "Meeting logged", FOLLOW_UP: "Follow-up" } as Record<string, string>)[T] || "Note";
      await p.query(`insert into "activities" (id,"companyId","contactId",type,subject,content,"userId","createdAt","updatedAt") values ($1,$2,$3,$4::"ActivityType",$5,$6,$7,now(),now())`,
        [newId("ac"), cid, id, T, subj, b.note.trim(), session.userId]);
      return NextResponse.json({ ok: true });
    }
    if (typeof b.task === "string" && b.task.trim()) {
      await p.query(`insert into "tasks" (id,title,"dueAt","isCompleted","companyId","contactId","assignedToId","createdAt","updatedAt") values ($1,$2,${b.due ? "$3::timestamp" : "null"},false,${b.due ? "$4" : "$3"},${b.due ? "$5" : "$4"},${b.due ? "$6" : "$5"},now(),now())`,
        b.due ? [newId("tk"), b.task.trim(), s(b.due), cid, id, session.userId] : [newId("tk"), b.task.trim(), cid, id, session.userId]);
      return NextResponse.json({ ok: true });
    }
    if (typeof b.dealName === "string" && b.dealName.trim()) {
      const ct = await p.query(`select "firstName","lastName","accountId" from "contacts" where id=$1 and "companyId"=$2 limit 1`, [id, cid]);
      const row = ct.rows[0] || {};
      const lid = newId("ld");
      await p.query(`insert into "leads" (id,"firstName","lastName",value,notes,"companyId","createdById",contact_id,"accountId","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [lid, s(row.firstName) || "Deal", s(row.lastName) || "", b.dealValue != null ? Number(b.dealValue) : null, s(b.dealName), cid, session.userId, id, s(row.accountId)]);
      return NextResponse.json({ ok: true, leadId: lid });
    }
    // field edit
    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    for (const f of ["firstName", "lastName", "title", "email", "phone", "whatsApp", "notes", "leadSource", "salutation", "addressLine1", "city", "country", "website", "instagram", "linkedIn", "contactKind"]) if (f in b) { sets.push(`"${f}"=$${i}`); vals.push(s(b[f])); i++; }
    if ("assignedToId" in b) { sets.push(`"assignedToId"=$${i}`); vals.push(b.assignedToId && String(b.assignedToId).trim() ? String(b.assignedToId) : null); i++; }
    if (typeof b.status === "string" && ["NEW","CONTACTED","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST","ON_HOLD"].includes(b.status)) { sets.push(`"status"=$${i}::"ContactStatus"`); vals.push(b.status); i++; }
    if ("accountId" in b) {
      const aid = b.accountId ? String(b.accountId) : null;
      if (aid) { const own = await p.query(`select id from "accounts" where id=$1 and "companyId"=$2 limit 1`, [aid, cid]); if (!own.rows[0]) return NextResponse.json({ error: "Company not found" }, { status: 400 }); }
      sets.push(`"accountId"=$${i}`); vals.push(aid); i++;
    }
    if (!sets.length) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
    sets.push(`"updatedAt"=now()`); vals.push(id, cid);
    await p.query(`update "contacts" set ${sets.join(", ")} where id=$${i} and "companyId"=$${i + 1}`, vals);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 });
  }
}
