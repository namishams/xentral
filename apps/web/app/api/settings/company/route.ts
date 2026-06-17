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

const FIELDS = ["name", "phone", "website", "address", "taxNumber", "whatsApp", "currency", "timezone", "dateFormat", "locale"] as const;

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, name, coalesce(phone,'') as phone, coalesce(website,'') as website, coalesce(address,'') as address,
              coalesce("taxNumber",'') as "taxNumber", coalesce("whatsApp",'') as "whatsApp", coalesce(currency,'AED') as currency,
              coalesce(timezone,'Asia/Dubai') as timezone, coalesce("dateFormat",'DD/MM/YYYY') as "dateFormat", coalesce(locale,'en') as locale,
              plan, credits
         from "companies" where id = $1 limit 1`, [session.companyId]);
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ company: rows[0] });
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  for (const f of FIELDS) if (f in b) {
    if (f === "name" && !String(b[f] ?? "").trim()) continue;
    sets.push(`"${f}" = $${i}`); vals.push(b[f] == null ? null : String(b[f])); i++;
  }
  if (!sets.length) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
  sets.push(`"updatedAt" = now()`); vals.push(session.companyId);
  try {
    const r = await pool(url).query(`update "companies" set ${sets.join(", ")} where id = $${i}`, vals);
    if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 }); }
}
