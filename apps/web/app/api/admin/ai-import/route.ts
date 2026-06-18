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
const newId = (pf: string) => pf + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

async function resolveKey(url: string, companyId: string): Promise<{ key: string; model: string } | null> {
  const envKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-") ? process.env.OPENAI_API_KEY : "";
  try {
    const { rows } = await pool(url).query(
      `select "apiKey", "defaultModel" from "ai_providers" where "companyId" = $1 and provider = 'openai' and "isActive" = true and "apiKey" is not null order by "updatedAt" desc limit 1`, [companyId]);
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
  const id = newId("mkl");
  const p = pool(url);
  try {
    await p.query(
      `insert into "marketplace_leads" (id, title, specialty, category, "originCountry", "originRegion", quality, summary, "firstName", "lastName", phone, email, "hasPhone", "hasWhatsApp", "hasEmail", "hasLinkedIn", "initialPrice", "minPrice", "decayAmount", "decayInterval", status, "maxPurchases", "purchaseCount", listing_type, "listedAt", "createdAt", "updatedAt", "companyId")
       values ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,0,24,'DRAFT',3,0,'STANDARD',now(),now(),now(),$18)`,
      [id, name, str("category") || "Healthcare", str("originCountry") || region, region, quality, str("summary"),
       str("firstName"), str("lastName"), str("phone"), str("email"),
       !!data.hasPhone || !!str("phone"), !!data.hasWhatsApp, !!data.hasEmail || !!str("email"), !!data.hasLinkedIn,
       price, Math.round(price * 0.6), s.companyId],
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Could not save lead" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id, lead: { name, category: str("category") || "Healthcare", region, quality, price, summary: str("summary") } });
}
