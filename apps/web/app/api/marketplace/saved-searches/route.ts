import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, name, coalesce(category,'') as category, coalesce(region,'') as region, coalesce(quality,'') as quality, coalesce(sort,'') as sort
         from "marketplace_saved_searches" where "companyId" = $1 order by "createdAt" desc limit 30`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const s = (v: unknown) => (v == null || v === "" ? null : String(v));
  const id = randomUUID();
  try {
    await pool(url).query(
      `insert into "marketplace_saved_searches" (id, "companyId", "userId", name, category, region, quality, sort, "createdAt") values ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
      [id, session.companyId, session.userId, s(b.name) || "Saved search", s(b.category), s(b.region), s(b.quality), s(b.sort)]);
    return NextResponse.json({ ok: true, id });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
