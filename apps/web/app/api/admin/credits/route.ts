import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
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

/** Operator credit control: grant/deduct a tenant's credit balance. SUPER_ADMIN only. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const companyId = typeof b?.companyId === "string" ? b.companyId : "";
  const delta = Number(b?.delta);
  if (!companyId || !Number.isFinite(delta) || delta === 0) return NextResponse.json({ error: "companyId and non-zero delta required" }, { status: 400 });
  try {
    const r = await pool(url).query(
      `update companies set credits = greatest(0, coalesce(credits,0) + $1) where id = $2 returning credits`,
      [Math.round(delta), companyId],
    );
    if (!r.rowCount) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    return NextResponse.json({ ok: true, credits: Number(r.rows[0].credits) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 });
  }
}
