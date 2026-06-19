import "server-only";
import "../../../lib/session";
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

/** GET — audit trail for this workspace, newest first. ?q= filters, ?limit= caps. */
export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(sp.get("limit")) || 300, 1000);
  try {
    const { rows } = await pool(url).query(
      `select a.id, a.action, coalesce(a."targetType",'') as "targetType", coalesce(a."targetId",'') as "targetId",
              a.meta, to_char(a."createdAt",'DD Mon YYYY HH24:MI') as "when", a."createdAt" as raw,
              coalesce(u.name, u.email, 'system') as actor
         from "audit_logs" a left join "users" u on u.id = a."userId"
        where a."companyId" = $1 order by a."createdAt" desc limit $2`, [session.companyId, limit]);
    const mapped = rows.map((r) => ({ ...r, meta: r.meta == null ? null : (typeof r.meta === "string" ? r.meta : JSON.stringify(r.meta)) }));
    const filtered = q ? mapped.filter((r) => (`${r.actor} ${r.action} ${r.targetType} ${r.targetId} ${r.meta || ""}`).toLowerCase().includes(q)) : mapped;
    return NextResponse.json({ rows: filtered });
  } catch { return NextResponse.json({ rows: [] }); }
}
