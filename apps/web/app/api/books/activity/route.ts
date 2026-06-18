import "server-only";
import "../../../../lib/session";
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
const newId = () => "ac" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
type LC = { key: string; label: string; at: string; who?: string | null; type: string };

async function resolveDoc(p: Pool, docType: string, docId: string, cid: string): Promise<{ contactId: string | null; lifecycle: LC[] } | null> {
  if (docType === "QUOTE") {
    const r = await p.query(
      `select q.number, q.status::text as status, q."createdAt" as "createdAt", q."sentAt" as "sentAt", q."viewedAt" as "viewedAt", q."decidedAt" as "decidedAt",
              u.name as who, bc."contactId" as "contactId"
         from "quotes" q left join "users" u on u.id = q."createdById" left join "billing_customers" bc on bc.id = q."customerId"
        where q.id = $1 and q."companyId" = $2 limit 1`, [docId, cid]);
    const q = r.rows[0]; if (!q) return null;
    const lc: LC[] = [{ key: "created", label: `Offer ${q.number} created`, at: q.createdAt, who: q.who, type: "STATUS_CHANGE" }];
    if (q.sentAt) lc.push({ key: "sent", label: "Sent to customer", at: q.sentAt, type: "EMAIL" });
    if (q.viewedAt) lc.push({ key: "viewed", label: "Viewed by customer", at: q.viewedAt, type: "STATUS_CHANGE" });
    if (q.decidedAt) lc.push({ key: "decided", label: q.status === "ACCEPTED" ? "Accepted by customer" : q.status === "REJECTED" ? "Declined by customer" : "Decision recorded", at: q.decidedAt, type: "STATUS_CHANGE" });
    return { contactId: q.contactId, lifecycle: lc };
  }
  const r = await p.query(
    `select i.number, i.status::text as status, i."createdAt" as "createdAt", i."sentAt" as "sentAt", i."viewedAt" as "viewedAt",
            u.name as who, bc."contactId" as "contactId"
       from "invoices" i left join "users" u on u.id = i."createdById" left join "billing_customers" bc on bc.id = i."customerId"
      where i.id = $1 and i."companyId" = $2 limit 1`, [docId, cid]);
  const inv = r.rows[0]; if (!inv) return null;
  const lc: LC[] = [{ key: "created", label: `Invoice ${inv.number} created`, at: inv.createdAt, who: inv.who, type: "STATUS_CHANGE" }];
  if (inv.sentAt) lc.push({ key: "sent", label: "Sent to customer", at: inv.sentAt, type: "EMAIL" });
  if (inv.viewedAt) lc.push({ key: "viewed", label: "Viewed by customer", at: inv.viewedAt, type: "STATUS_CHANGE" });
  const pays = await p.query(`select amount, method, "paidAt" as "paidAt" from "payment_records" where "invoiceId" = $1 order by "paidAt" asc`, [docId]).catch(() => ({ rows: [] as Record<string, unknown>[] }));
  pays.rows.forEach((pm, i) => lc.push({ key: `pay${i}`, label: `Payment received — ${String(pm.method || "").replace(/_/g, " ").toLowerCase()}`, at: String(pm.paidAt), type: "BILLING" }));
  return { contactId: inv.contactId, lifecycle: lc };
}

export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ lifecycle: [], notes: [], comms: { whatsapp: [], activities: [] }, contactId: null });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  const sp = new URL(req.url).searchParams;
  const docType = (sp.get("docType") || "").toUpperCase();
  const docId = sp.get("docId") || "";
  if (!["QUOTE", "INVOICE"].includes(docType) || !docId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const doc = await resolveDoc(p, docType, docId, cid);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const col = docType === "QUOTE" ? "quoteId" : "invoiceId";
  const notes = (await p.query(
    `select a.id, a.subject, a.content, a.type::text as type, to_char(a."createdAt",'DD Mon YYYY, HH24:MI') as at, u.name as who
       from "activities" a left join "users" u on u.id = a."userId"
      where a."${col}" = $1 and a."companyId" = $2 order by a."createdAt" desc limit 50`, [docId, cid]).catch(() => ({ rows: [] }))).rows;

  let comms: { whatsapp: Record<string, unknown>[]; activities: Record<string, unknown>[] } = { whatsapp: [], activities: [] };
  if (doc.contactId) {
    const [wa, acts] = await Promise.all([
      p.query(`select id, contact_phone as "contactPhone", to_char(last_message_at,'DD Mon YYYY') as "lastMessageAt", last_message_body as "lastMessageBody" from "whatsapp_conversations" where company_id = $1 and contact_id = $2 order by last_message_at desc limit 4`, [cid, doc.contactId]).catch(() => ({ rows: [] })),
      p.query(`select id, subject, content, type::text as type, to_char("createdAt",'DD Mon YYYY, HH24:MI') as at from "activities" where "companyId" = $1 and "contactId" = $2 and type::text in ('EMAIL','CALL','MEETING') order by "createdAt" desc limit 8`, [cid, doc.contactId]).catch(() => ({ rows: [] })),
    ]);
    comms = { whatsapp: wa.rows, activities: acts.rows };
  }

  return NextResponse.json({ contactId: doc.contactId, lifecycle: doc.lifecycle, notes, comms });
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const docType = String(b.docType || "").toUpperCase();
  const docId = String(b.docId || "");
  const content = String(b.content || "").trim();
  if (!["QUOTE", "INVOICE"].includes(docType) || !docId || !content) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const doc = await resolveDoc(p, docType, docId, cid);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const col = docType === "QUOTE" ? "quoteId" : "invoiceId";
  const id = newId();
  try {
    await p.query(
      `insert into "activities" (id,type,subject,content,"companyId","userId","contactId","${col}","createdAt","updatedAt") values ($1,'NOTE'::"ActivityType",'Internal note',$2,$3,$4,$5,$6,now(),now())`,
      [id, content, cid, session.userId, doc.contactId, docId]);
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 }); }
  return NextResponse.json({ ok: true, id });
}
