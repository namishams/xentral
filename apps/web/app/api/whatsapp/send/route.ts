import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp send — outbound reply via the Meta Graph API. DORMANT until armed
 * (XENTRAL_LIVE_DATA=1 + DATABASE_URL + a session). Mirrors the existing app:
 * loads the conversation + account (tenant-checked), posts to graph.facebook.com
 * with the account's access token, stores the outbound message and bumps the
 * conversation. Internal notes skip the Meta call. 503 on the public preview.
 */

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) {
    return NextResponse.json({ error: "not_configured", message: "WhatsApp activates when the workspace goes live." }, { status: 503 });
  }
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let conversationId = "", message = "", isNote = false;
  try {
    const b = await req.json();
    conversationId = String(b.conversationId || "");
    message = String(b.message || "");
    isNote = Boolean(b.isNote);
  } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!conversationId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = pool(url);
  const convRes = await db.query(
    `select c.id, c."company_id" as "companyId", c."contact_phone" as "contactPhone", a."phone_number_id" as "phoneNumberId", a."access_token" as "accessToken"
       from "whatsapp_conversations" c join "whatsapp_accounts" a on a.id = c."account_id" where c.id = $1 limit 1`, [conversationId]);
  const conv = convRes.rows[0];
  if (!conv || conv.companyId !== session.companyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isNote) {
    const id = randomUUID();
    await db.query(`insert into "whatsapp_messages" (id, "conversation_id", direction, type, body, status, "sentByName", "isNote", timestamp) values ($1,$2,'OUTBOUND','text',$3,'SENT',$4,true, now())`, [id, conv.id, message, "Agent"]);
    await db.query(`update "whatsapp_conversations" set "last_message_at" = now() where id = $1`, [conv.id]);
    return NextResponse.json({ success: true });
  }

  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${conv.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${conv.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: conv.contactPhone, type: "text", text: { body: message, preview_url: false } }),
  });
  const metaData: any = await metaRes.json().catch(() => ({}));
  if (!metaRes.ok) return NextResponse.json({ error: metaData?.error?.message ?? "Failed to send" }, { status: 500 });

  const waMessageId = metaData?.messages?.[0]?.id ?? null;
  await db.query(`insert into "whatsapp_messages" (id, "conversation_id", "wa_message_id", direction, type, body, status, "sentByName", timestamp) values ($1,$2,$3,'OUTBOUND','text',$4,'SENT',$5, now())`, [randomUUID(), conv.id, waMessageId, message, "Agent"]);
  await db.query(`update "whatsapp_conversations" set "last_message_at" = now(), "last_message_body" = $2 where id = $1`, [conv.id, message.slice(0, 120)]);
  return NextResponse.json({ success: true });
}
