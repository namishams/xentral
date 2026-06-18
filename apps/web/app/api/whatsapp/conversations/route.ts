import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
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

/** Inbox company. The Xentral operator (SUPER_ADMIN) IS Mediflow — they run the
 *  lead-supply WhatsApp number — so they see that number's conversations. A normal
 *  tenant sees only their own. */
async function effectiveWaCompany(p: Pool, session: { companyId: string; role: string }): Promise<string> {
  if (session.role === "SUPER_ADMIN") {
    try {
      const r = await p.query(`select "companyId" from "whatsapp_accounts" where "companyId" is not null limit 1`);
      if (r.rows[0]?.companyId) return String(r.rows[0].companyId);
    } catch { /* fall through */ }
  }
  return session.companyId;
}

/** WhatsApp conversations for the signed-in workspace. Empty on the dormant preview. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ conversations: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = pool(url);
    const companyId = await effectiveWaCompany(p, session);
    const { rows } = await p.query(
      `select id, "contact_name" as name, "contact_phone" as phone, "last_message_body" as preview,
              "last_message_at" as at, "unread_count" as unread, status, "agent_mode" as mode, "leadStatus" as "leadStatus"
         from "whatsapp_conversations" where "company_id" = $1
        order by "last_message_at" desc nulls last limit 100`, [companyId]);
    return NextResponse.json({ conversations: rows });
  } catch {
    return NextResponse.json({ conversations: [] });
  }
}

/** POST — start a new chat (phone + optional name). Upserts the conversation on the supply number. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const phone = String(b.phone ?? "").replace(/^\+/, "").replace(/\s+/g, "");
  if (!phone) return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  const name = b.name == null ? null : String(b.name);
  const p = pool(url);
  const companyId = await effectiveWaCompany(p, session);
  try {
    const acc = (await p.query(`select id from "whatsapp_accounts" where "companyId" = $1 limit 1`, [companyId])).rows[0];
    if (!acc) return NextResponse.json({ error: "WhatsApp not configured" }, { status: 404 });
    const ex = (await p.query(`select id from "whatsapp_conversations" where account_id = $1 and contact_phone = $2 limit 1`, [acc.id, phone])).rows[0];
    if (ex) { if (name) await p.query(`update "whatsapp_conversations" set contact_name = $2 where id = $1`, [ex.id, name]); return NextResponse.json({ id: ex.id }, { status: 200 }); }
    const id = randomUUID();
    await p.query(
      `insert into "whatsapp_conversations" (id, account_id, company_id, contact_phone, contact_name, status, agent_mode, "leadStatus", unread_count, last_message_at, created_at)
       values ($1,$2,$3,$4,$5,'OPEN','HUMAN','PENDING',0, now(), now())`,
      [id, acc.id, companyId, phone, name]);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
