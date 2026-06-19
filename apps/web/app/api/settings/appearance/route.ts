import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { logAudit } from "../../../../lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ themeAccent: null });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(`select "themeAccent" from "companies" where id = $1`, [session.companyId]);
    return NextResponse.json({ themeAccent: rows[0]?.themeAccent || null });
  } catch { return NextResponse.json({ themeAccent: null }); }
}

/** PATCH — set the workspace accent colour (hex) that re-themes the whole app. */
export async function PATCH(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  let accent: string | null = b.themeAccent == null || b.themeAccent === "" ? null : String(b.themeAccent).trim();
  if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) return NextResponse.json({ error: "Use a 6-digit hex colour like #0064d9" }, { status: 400 });
  if (accent) accent = accent.toLowerCase();
  try {
    await pool(url).query(`update "companies" set "themeAccent" = $1, "updatedAt" = now() where id = $2`, [accent, session.companyId]);
    await logAudit("appearance.theme.update", { targetType: "company", meta: { themeAccent: accent } });
    return NextResponse.json({ ok: true, themeAccent: accent });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 }); }
}
