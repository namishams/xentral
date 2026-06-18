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
    // Prefer the operator's own configured key, else ANY active platform OpenAI key
    // (the env var can be stale, so a live DB key wins over it).
    const { rows } = await pool(url).query(
      `select "apiKey", "defaultModel" from "ai_providers"
        where provider = 'openai' and "isActive" = true and "apiKey" is not null
        order by ("companyId" = $1) desc, "updatedAt" desc limit 1`, [companyId]);
    const dbKey = rows[0]?.apiKey && String(rows[0].apiKey).startsWith("sk-") ? String(rows[0].apiKey) : "";
    const key = dbKey || envKey;
    if (!key) return null;
    const m = String(rows[0]?.defaultModel || "");
    // ensure a vision-capable model
    const model = /gpt-4o|gpt-4\.1|o4|vision/i.test(m) ? m : "gpt-4o-mini";
    return { key, model };
  } catch { return envKey ? { key: envKey, model: "gpt-4o-mini" } : null; }
}

/** AI Lead Import — GPT-4 Vision extracts a lead from screenshots and drafts it into marketplace supply. SUPER_ADMIN only. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const images: string[] = Array.isArray(b.images) ? (b.images as string[]).filter((x) => typeof x === "string" && x.startsWith("data:image")).slice(0, 3) : [];
  if (!images.length) return NextResponse.json({ error: "Attach 1–3 screenshots." }, { status: 400 });

  const creds = await resolveKey(url, s.companyId);
  if (!creds) return NextResponse.json({ error: "No OpenAI key configured. Add one under Settings · AI Hub.", notConfigured: true }, { status: 400 });

  const client = new OpenAI({ apiKey: creds.key });
  const sys = "You extract a single sales lead (a healthcare or professional candidate) from screenshots (WhatsApp, email, LinkedIn, CV). Return STRICT JSON only with keys: name (job title/role e.g. 'Registered Nurse'), specialty, category (e.g. Healthcare), originRegion (e.g. UAE, Asia/Africa, Unknown), originCountry, quality (one of HOT, WARM, STANDARD), summary (1 sentence), firstName, lastName, phone, email, hasPhone (bool), hasWhatsApp (bool), hasEmail (bool), hasLinkedIn (bool), suggestedPrice (number AED, 30-150). Use empty string/false when unknown.";
  let data: Record<string, unknown> = {};
  try {
    const r = await client.chat.completions.create({
      model: creds.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: [
          { type: "text", text: "Extract the lead from these screenshots." },
          ...images.map((u) => ({ type: "image_url" as const, image_url: { url: u } })),
        ] },
      ],
      max_tokens: 700,
    });
    data = JSON.parse(r.choices[0]?.message?.content || "{}");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "AI extraction failed" }, { status: 502 });
  }

  const str = (k: string) => (data[k] == null ? "" : String(data[k]));
  const price = Math.min(150, Math.max(30, Number(data.suggestedPrice) || 50));
  const quality = ["HOT", "WARM", "STANDARD"].includes(str("quality").toUpperCase()) ? str("quality").toUpperCase() : "STANDARD";
  const region = str("originRegion") || "Unknown";
  const name = str("name") || str("specialty") || "Imported lead";

  // IMPORTANT: do NOT insert into marketplace_leads here. The operator must
  // review the extracted data, then choose a listing type (shared / exclusive /
  // best offer) and set pricing in the Add Lead form. We only return what we found.
  const lead = {
    specialty: name,
    category: str("category") || "Healthcare",
    originCountry: str("originCountry") || region,
    originRegion: region,
    currentLocation: str("currentLocation"),
    quality,
    summary: str("summary"),
    firstName: str("firstName"),
    lastName: str("lastName"),
    phone: str("phone"),
    email: str("email"),
    linkedIn: str("linkedIn"),
    notes: str("notes") || str("summary"),
    hasPhone: !!data.hasPhone || !!str("phone"),
    hasWhatsApp: !!data.hasWhatsApp,
    hasEmail: !!data.hasEmail || !!str("email"),
    hasLinkedIn: !!data.hasLinkedIn || !!str("linkedIn"),
    hasCV: !!data.hasCV,
    hasDataflow: !!data.hasDataflow,
    suggestedPrice: price,
  };
  return NextResponse.json({ ok: true, lead });
}
