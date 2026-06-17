import "server-only";
import { NextResponse } from "next/server";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { Pool } from "pg";
import { generateReply, type ChatTurn } from "../../../../lib/wa-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API webhook. DORMANT until XENTRAL_LIVE_DATA=1 + DATABASE_URL.
 *  - GET: Meta verification handshake.
 *  - POST: HMAC-verified; stores every inbound message (no lead lost).
 *  - AI auto-reply: ONLY when XENTRAL_WA_AI=1 (off by default) and the
 *    conversation's agent_mode is AI. Uses the company's configured agent. So the
 *    agent never messages real leads until you explicitly enable it.
 */

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}
const armed = () => process.env.XENTRAL_LIVE_DATA === "1" && !!process.env.DATABASE_URL;
const aiOn = () => process.env.XENTRAL_WA_AI === "1";

async function sendWA(phoneNumberId: string, token: string, to: string, text: string) {
  return fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}

export async function GET(req: Request) {
  if (!armed()) return new NextResponse("not_configured", { status: 503 });
  const u = new URL(req.url);
  const mode = u.searchParams.get("hub.mode");
  const token = u.searchParams.get("hub.verify_token");
  const challenge = u.searchParams.get("hub.challenge");
  if (mode !== "subscribe" || !token) return new NextResponse("Bad Request", { status: 400 });
  if (process.env.WHATSAPP_VERIFY_TOKEN && token === process.env.WHATSAPP_VERIFY_TOKEN) return new NextResponse(challenge ?? "", { status: 200 });
  try {
    const r = await pool(process.env.DATABASE_URL!).query(`select 1 from "whatsapp_accounts" where "verify_token" = $1 limit 1`, [token]);
    if (r.rowCount) return new NextResponse(challenge ?? "", { status: 200 });
  } catch { /* noop */ }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  if (!armed()) return new NextResponse("not_configured", { status: 503 });
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (secret) {
    const sig = req.headers.get("x-hub-signature-256") || "";
    const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
    const a = Buffer.from(sig); const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  try {
    const db = pool(process.env.DATABASE_URL!);
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId || !Array.isArray(value.messages)) continue;
        const acc = await db.query(`select id, "companyId", "access_token" as token from "whatsapp_accounts" where "phone_number_id" = $1 limit 1`, [phoneNumberId]);
        const account = acc.rows[0];
        if (!account) continue;
        const profileName = value.contacts?.[0]?.profile?.name ?? null;

        for (const msg of value.messages) {
          const from = String(msg.from || "");
          if (!from) continue;
          const text = msg.text?.body ?? (msg.type ? `[${msg.type}]` : "");
          const conv = await db.query(
            `insert into "whatsapp_conversations" (id, "account_id", "company_id", "contact_phone", "contact_name", "last_message_at", "last_message_body", "unread_count", status, "created_at")
             values ($1,$2,$3,$4,$5, now(), $6, 1, 'OPEN', now())
             on conflict ("account_id","contact_phone") do update set "last_message_at" = now(), "last_message_body" = $6, "unread_count" = "whatsapp_conversations"."unread_count" + 1, "contact_name" = coalesce("whatsapp_conversations"."contact_name", $5)
             returning id, "agent_mode" as mode`,
            [randomUUID(), account.id, account.companyId, from, profileName, String(text).slice(0, 120)],
          );
          const conversationId = conv.rows[0].id;
          await db.query(
            `insert into "whatsapp_messages" (id, "conversation_id", "wa_message_id", direction, type, body, status, timestamp)
             values ($1,$2,$3,'INBOUND',$4,$5,'DELIVERED', now()) on conflict ("wa_message_id") do nothing`,
            [randomUUID(), conversationId, msg.id ?? null, msg.type ?? "text", text],
          );

          // ── AI auto-reply (opt-in via XENTRAL_WA_AI=1) ──
          if (aiOn() && conv.rows[0].mode === "AI" && msg.text?.body) {
            try {
              const co = await db.query(`select "openaiKey","agent_name","agent_tone","agent_knowledge","agent_custom_prompt","agent_business_type","agent_playbook","agent_signoff" from "companies" where id = $1 limit 1`, [account.companyId]);
              const c = co.rows[0] || {};
              const cfg = { apiKey: c.openaiKey || process.env.OPENAI_API_KEY || "", agentName: c.agent_name || "Assistant", agentTone: c.agent_tone || "professional", agentKnowledge: c.agent_knowledge || "", agentCustomPrompt: c.agent_custom_prompt || "", businessType: c.agent_business_type || "", playbook: c.agent_playbook || "", signoff: c.agent_signoff || "" };
              const hist = await db.query(`select direction, body from "whatsapp_messages" where "conversation_id" = $1 and body is not null order by timestamp desc limit 12`, [conversationId]);
              const history: ChatTurn[] = hist.rows.reverse().map((r: any) => ({ role: r.direction === "INBOUND" ? "user" : "assistant", content: String(r.body) }));
              const reply = await generateReply(cfg, history.slice(0, -1), String(msg.text.body));
              if (reply) {
                const r = await sendWA(phoneNumberId, account.token, from, reply);
                const md: any = await r.json().catch(() => ({}));
                if (r.ok) {
                  await db.query(`insert into "whatsapp_messages" (id, "conversation_id", "wa_message_id", direction, type, body, status, "isAi", timestamp) values ($1,$2,$3,'OUTBOUND','text',$4,'SENT',true, now())`, [randomUUID(), conversationId, md?.messages?.[0]?.id ?? null, reply]);
                  await db.query(`update "whatsapp_conversations" set "last_message_at" = now(), "last_message_body" = $2 where id = $1`, [conversationId, reply.slice(0, 120)]);
                }
              }
            } catch { /* agent best-effort — never fail the webhook */ }
          }
        }
      }
    }
  } catch { /* never fail the webhook */ }

  return NextResponse.json({ ok: true });
}
