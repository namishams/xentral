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
  let companyName = "", credits = 0, userName = "";
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const c = (await pool(url).query(`select name, coalesce(credits,0)::int as credits from companies where id=$1 limit 1`, [s.companyId])).rows[0];
      if (c) { companyName = String(c.name || ""); credits = Number(c.credits) || 0; }
      const u = (await pool(url).query(`select name from users where id=$1 limit 1`, [s.userId])).rows[0];
      if (u) userName = String(u.name || "");
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
  });
}
