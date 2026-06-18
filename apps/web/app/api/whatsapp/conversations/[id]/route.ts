import "server-only";
import "../../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

async function supplyCompany(p: Pool, session: { companyId: string; role: string }): Promise<string> {
  if (session.role === "SUPER_ADMIN") {
    try { const r = await p.query(`select "companyId" from "whatsapp_accounts" where "companyId" is not null limit 1`); if (r.rows[0]?.companyId) return String(r.rows[0].companyId); } catch { /* noop */ }
  }
  return session.companyId;
}

function resolveName(raw?: string | null, phone?: string | null): { firstName: string; lastName: string } {
  const clean = (v?: string | null) => { const x = (v ?? "").replace(/\[(document|image|video|audio|sticker|location|contact)\]/gi, "").replace(/\s+/g, " ").trim(); if (!x || x.length < 2 || /^(unknown( lead)?|lead|new contact|null|undefined|n\/a|-+)$/i.test(x)) return null; return x; };
  const n = clean(raw);
  if (n) { const parts = n.split(" "); return { firstName: parts[0] ?? n, lastName: parts.slice(1).join(" ") }; }
  return { firstName: "WhatsApp +" + String(phone || "").replace(/^\+/, ""), lastName: "" };
}

/** PATCH — update a WhatsApp conversation: agent mode, lead status (with side-effects),
 *  or conversation status (open/resolved/archived). Operator may act on the supply inbox. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const p = pool(url);
  const company = await supplyCompany(p, session);
  const id = params.id;

  const conv = (await p.query(`select id, company_id as "companyId", contact_name as "contactName", contact_phone as "contactPhone", contact_id as "contactId" from "whatsapp_conversations" where id = $1 limit 1`, [id])).rows[0];
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.companyId !== company && session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ownerCompany = String(conv.companyId || company);

  const agentMode = b.agentMode != null ? String(b.agentMode) : null;
  const leadStatus = b.leadStatus != null ? String(b.leadStatus) : null;
  const status = b.status != null ? String(b.status) : null;

  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  if (agentMode) { sets.push(`agent_mode = $${i++}`); vals.push(agentMode); }
  if (leadStatus) { sets.push(`"leadStatus" = $${i++}`); vals.push(leadStatus); }
  if (status) { sets.push(`status = $${i++}`); vals.push(status); if (status === "RESOLVED") sets.push(`resolved_at = now()`); }
  if (sets.length) { vals.push(id); await p.query(`update "whatsapp_conversations" set ${sets.join(", ")} where id = $${i}`, vals); }

  let contact: { id: string; firstName: string; lastName: string | null; phone: string | null; email: string | null } | null = null;
  let listed = false;

  // NOT_INTERESTED → auto-list on the marketplace
  if (leadStatus === "NOT_INTERESTED") {
    try {
      const msgs = await p.query(`select body from "whatsapp_messages" where conversation_id = $1 and direction = 'INBOUND' and body is not null order by timestamp asc limit 5`, [id]);
      const summary = (msgs.rows.map((m) => m.body).filter(Boolean).join(" ") || `WhatsApp lead from ${conv.contactPhone}`).slice(0, 200);
      const nm = resolveName(conv.contactName, conv.contactPhone);
      await p.query(
        `insert into "marketplace_leads" (id, title, specialty, category, "originCountry", "originRegion", quality, summary,
            "hasPhone","hasWhatsApp","firstName","lastName",phone,
            "initialPrice","minPrice","decayAmount","decayInterval","maxPurchases","purchaseCount",
            listing_type, status, "listedAt","createdAt","updatedAt","companyId")
         values ($1,$2,$2,$3,$4,$5,$6,$7, true,true,$8,$9,$10, 150,50,10,6,3,0, 'shared','AVAILABLE', now(),now(),now(),$11)`,
        [randomUUID(), "General", "Healthcare", "UAE", "Unknown", "WARM", summary, nm.firstName, nm.lastName, conv.contactPhone, ownerCompany]);
      listed = true;
    } catch { /* best-effort */ }
  }

  // INTERESTED / CONVERTED → create or link a CRM contact
  if (leadStatus === "CONVERTED" || leadStatus === "INTERESTED") {
    try {
      if (conv.contactId) {
        contact = (await p.query(`select id, "firstName", "lastName", phone, email from "contacts" where id = $1`, [conv.contactId])).rows[0] || null;
      } else {
        const digits = String(conv.contactPhone || "").replace(/\D/g, "");
        let c = digits ? (await p.query(`select id, "firstName", "lastName", phone, email from "contacts" where "companyId" = $1 and (phone like '%'||$2||'%' or "whatsApp" like '%'||$2||'%') limit 1`, [ownerCompany, digits])).rows[0] : null;
        if (!c) {
          const nm = resolveName(conv.contactName, conv.contactPhone);
          const cid = randomUUID();
          await p.query(
            `insert into "contacts" (id, "firstName", "lastName", phone, "whatsApp", status, "contactType", "ownerId", "companyId", notes, "createdAt", "updatedAt")
             values ($1,$2,$3,$4,$4,'NEW','Business',$5,$6,$7, now(), now())`,
            [cid, nm.firstName, nm.lastName, conv.contactPhone, session.userId, ownerCompany, `Created from WhatsApp — marked ${leadStatus.toLowerCase()}.`]);
          c = { id: cid, firstName: nm.firstName, lastName: nm.lastName, phone: conv.contactPhone, email: null };
        }
        await p.query(`update "whatsapp_conversations" set contact_id = $2 where id = $1`, [id, c.id]);
        contact = c;
      }
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ success: true, contact, listed });
}

/** DELETE — remove a conversation and its messages (user-initiated). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = pool(url);
  const company = await supplyCompany(p, session);
  const conv = (await p.query(`select company_id as "companyId" from "whatsapp_conversations" where id = $1 limit 1`, [params.id])).rows[0];
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.companyId !== company && session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });
  await p.query(`delete from "whatsapp_messages" where conversation_id = $1`, [params.id]);
  await p.query(`delete from "whatsapp_conversations" where id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}
