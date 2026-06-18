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

async function resolveKey(url: string, companyId: string): Promise<string | null> {
  const envKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-") ? process.env.OPENAI_API_KEY : "";
  try {
    const { rows } = await pool(url).query(
      `select "apiKey" from "ai_providers" where provider='openai' and "isActive"=true and "apiKey" is not null order by ("companyId" = $1) desc, "updatedAt" desc limit 1`, [companyId]);
    const dbKey = rows[0]?.apiKey && String(rows[0].apiKey).startsWith("sk-") ? String(rows[0].apiKey) : "";
    return dbKey || envKey || null;
  } catch { return envKey || null; }
}

/** AI analysis of a WhatsApp conversation — lead profile, DHA readiness, quality, next step. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ result: "Unavailable" });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const conversation = String(b.conversation ?? "");
  const contactName = String(b.contactName ?? "this lead");
  if (!conversation) return NextResponse.json({ result: "No conversation" });
  const key = await resolveKey(url, session.companyId);
  if (!key) return NextResponse.json({ result: "No OpenAI key configured (Settings · AI Hub)." });
  try {
    const openai = new OpenAI({ apiKey: key });
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        { role: "system", content: "You are an expert DHA licensing consultant and sales manager for medical recruiting in Dubai/UAE. Analyze WhatsApp conversations and give a precise summary in 3-4 sentences. Format: 1) Lead profile (specialty, country, experience). 2) DHA readiness: Do they have DataFlow? Know the DHA process? 3) Lead quality (Hot/Warm/Cold). 4) Concrete next step (e.g. start DataFlow, exam prep, direct placement)." },
        { role: "user", content: `Analyze this conversation with "${contactName}":\n\n${conversation}` },
      ],
    });
    return NextResponse.json({ result: r.choices[0]?.message?.content || "Not available" });
  } catch {
    return NextResponse.json({ result: "AI analysis failed" });
  }
}
