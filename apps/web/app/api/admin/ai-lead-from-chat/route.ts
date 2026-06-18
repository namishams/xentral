import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { Pool } from "pg";
import OpenAI from "openai";
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

async function resolveKey(url: string, companyId: string): Promise<{ key: string; model: string } | null> {
  const envKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-") ? process.env.OPENAI_API_KEY : "";
  try {
    const { rows } = await pool(url).query(
      `select "apiKey", "defaultModel" from "ai_providers"
        where provider = 'openai' and "isActive" = true and "apiKey" is not null
        order by ("companyId" = $1) desc, "updatedAt" desc limit 1`, [companyId]);
    const dbKey = rows[0]?.apiKey && String(rows[0].apiKey).startsWith("sk-") ? String(rows[0].apiKey) : "";
    const key = dbKey || envKey;
    if (!key) return null;
    const m = String(rows[0]?.defaultModel || "");
    const model = /gpt-4o|gpt-4\.1|o4|gpt-4-turbo/i.test(m) ? m : "gpt-4o-mini";
    return { key, model };
  } catch { return envKey ? { key: envKey, model: "gpt-4o-mini" } : null; }
}

/** AI lead extraction straight from a WhatsApp conversation transcript. SUPER_ADMIN only.
 *  Returns the extracted fields (same shape as AI Import) — does NOT insert. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const conversationId = String(b.conversationId ?? "");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const p = pool(url);
  let convName = ""; let convPhone = ""; let transcript = "";
  try {
    const conv = await p.query(`select "contact_name" as name, "contact_phone" as phone from "whatsapp_conversations" where id = $1 limit 1`, [conversationId]);
    if (!conv.rows[0]) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    convName = String(conv.rows[0].name || ""); convPhone = String(conv.rows[0].phone || "");
    const msgs = await p.query(
      `select direction, body, type from "whatsapp_messages" where "conversation_id" = $1 and body is not null order by timestamp asc limit 120`, [conversationId]);
    transcript = msgs.rows.map((m) => `${m.direction === "OUTBOUND" ? "Agent" : "Lead"}: ${m.body || "[" + m.type + "]"}`).join("\n").slice(0, 8000);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Could not load chat" }, { status: 500 });
  }
  if (!transcript.trim()) return NextResponse.json({ error: "This chat has no readable messages yet." }, { status: 400 });

  const creds = await resolveKey(url, s.companyId);
  if (!creds) return NextResponse.json({ error: "No OpenAI key configured. Add one under Settings · AI Hub.", notConfigured: true }, { status: 400 });

  const sys = "You read a WhatsApp conversation between a sales Agent and a Lead, and extract a single sellable lead. Return STRICT JSON only with keys: name (job title/role e.g. 'Registered Nurse'), specialty, category (e.g. Healthcare, Real Estate, Construction), originRegion (UAE, GCC, Asia/Africa, Europe, Americas or Unknown), originCountry, quality (HOT if ready/urgent, WARM if interested, STANDARD otherwise), summary (1 sentence), firstName, lastName, phone, email, hasPhone (bool), hasWhatsApp (bool, true), hasEmail (bool), hasLinkedIn (bool), suggestedPrice (number AED 30-150 based on quality). Use empty string/false when unknown. Infer phone from the conversation contact if present.";
  const userMsg = `Conversation contact: ${convName || "(unknown)"} ${convPhone ? "(" + convPhone + ")" : ""}\n\nTranscript:\n${transcript}`;

  let data: Record<string, unknown> = {};
  try {
    const client = new OpenAI({ apiKey: creds.key });
    const r = await client.chat.completions.create({
      model: creds.model,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
      max_tokens: 600,
    });
    data = JSON.parse(r.choices[0]?.message?.content || "{}");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "AI extraction failed" }, { status: 502 });
  }

  const str = (k: string) => (data[k] == null ? "" : String(data[k]));
  const price = Math.min(150, Math.max(30, Number(data.suggestedPrice) || 50));
  const quality = ["HOT", "WARM", "STANDARD"].includes(str("quality").toUpperCase()) ? str("quality").toUpperCase() : "STANDARD";
  const region = str("originRegion") || "Unknown";
  const lead = {
    specialty: str("name") || str("specialty") || "WhatsApp lead",
    category: str("category") || "Healthcare",
    originCountry: str("originCountry") || region,
    originRegion: region,
    currentLocation: str("currentLocation"),
    quality,
    summary: str("summary"),
    firstName: str("firstName") || convName.split(/\s+/)[0] || "",
    lastName: str("lastName") || convName.split(/\s+/).slice(1).join(" "),
    phone: str("phone") || convPhone,
    email: str("email"),
    notes: str("notes") || str("summary"),
    hasPhone: !!data.hasPhone || !!convPhone,
    hasWhatsApp: true,
    hasEmail: !!data.hasEmail || !!str("email"),
    hasLinkedIn: !!data.hasLinkedIn,
    suggestedPrice: price,
  };
  return NextResponse.json({ ok: true, lead });
}
