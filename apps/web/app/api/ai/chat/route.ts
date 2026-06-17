import "server-only";
import "../../../../lib/session"; // register SessionPort resolver into the shared app kernel instance
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

const SYSTEM = `You are Xentral AI, the built-in assistant inside Xentral — a UAE-first business operating system (CRM, WhatsApp inbox, leads marketplace, invoicing & quotes, inventory, accounting/ledger and payments via Telr).
Be concise, practical and friendly. Use UAE context: currency AED, 5% VAT, FTA e-invoicing.
You can explain, draft text (emails, WhatsApp replies, invoice line items), summarise and advise. When the user asks you to *do* something (create a contact, draft an invoice, schedule a meeting), describe exactly what you would create and tell them it's ready to confirm — actions are wired up progressively.
Keep answers short and skimmable. Prefer bullet points only when listing 3+ items.`;

type Msg = { role: "user" | "assistant" | "system"; content: string };

/** Resolve the workspace's OpenAI key + model from ai_providers, falling back to env. */
async function resolveKey(url: string, companyId: string): Promise<{ key: string; model: string } | null> {
  const envKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-") ? process.env.OPENAI_API_KEY : "";
  try {
    const { rows } = await pool(url).query(
      `select "apiKey", "defaultModel" from "ai_providers" where "companyId" = $1 and provider = 'openai' and "isActive" = true and "apiKey" is not null order by "updatedAt" desc limit 1`,
      [companyId]);
    const dbKey = rows[0]?.apiKey && String(rows[0].apiKey).startsWith("sk-") ? String(rows[0].apiKey) : "";
    const key = dbKey || envKey;
    if (!key) return null;
    return { key, model: rows[0]?.defaultModel || "gpt-4o-mini" };
  } catch {
    return envKey ? { key: envKey, model: "gpt-4o-mini" } : null;
  }
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ reply: "AI is available once the workspace is live." });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { messages?: Msg[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const history = Array.isArray(body.messages) ? body.messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-12) : [];
  if (history.length === 0) return NextResponse.json({ error: "No messages" }, { status: 400 });

  const cfg = await resolveKey(url, session.companyId);
  if (!cfg) return NextResponse.json({ reply: "Xentral AI isn't configured yet — add an OpenAI key in Settings → AI Hub and I'll come online." });

  try {
    const openai = new OpenAI({ apiKey: cfg.key });
    const res = await openai.chat.completions.create({
      model: cfg.model,
      temperature: 0.4,
      max_tokens: 700,
      messages: [{ role: "system", content: SYSTEM }, ...history.map((m) => ({ role: m.role, content: m.content }))],
    });
    const reply = res.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "I had trouble reaching the model just now. Please try again in a moment." });
  }
}
