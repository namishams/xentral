import "server-only";
import "../../../lib/session"; // side-effect: register SessionPort resolver
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

/** Identity endpoint for the client shell: role-aware nav + live workspace name & credits. */
export async function GET() {
  const s = await resolveSession();
  if (!s) return NextResponse.json({ authenticated: false, superAdmin: false });
  let companyName = "", credits = 0, userName = "", avatar: string | null = null, phone = "";
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const c = (await pool(url).query(`select name, coalesce(credits,0)::int as credits from companies where id=$1 limit 1`, [s.companyId])).rows[0];
      if (c) { companyName = String(c.name || ""); credits = Number(c.credits) || 0; }
      const u = (await pool(url).query(`select name, avatar, phone from users where id=$1 limit 1`, [s.userId])).rows[0];
      if (u) { userName = String(u.name || ""); avatar = u.avatar || null; phone = String(u.phone || ""); }
    } catch { /* ignore */ }
  }
  return NextResponse.json({
    authenticated: true,
    userId: s.userId,
    companyId: s.companyId,
    role: s.role,
    superAdmin: s.role === "SUPER_ADMIN",
    companyName,
    credits,
    userName,
    avatar,
    phone,
  });
}


/** PATCH — update the signed-in user's own profile (name, phone). */
export async function PATCH(req: Request) {
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  if (typeof b.name === "string" && b.name.trim()) { sets.push(`name = $${i}`); vals.push(b.name.trim()); i++; }
  if ("phone" in b) { sets.push(`phone = $${i}`); vals.push(b.phone == null ? null : String(b.phone)); i++; }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  sets.push(`"updatedAt" = now()`); vals.push(s.userId);
  try {
    await pool(url).query(`update "users" set ${sets.join(", ")} where id = $${i}`, vals);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 }); }
}
