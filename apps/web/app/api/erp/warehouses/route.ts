import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

/** Warehouses / stock locations. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, coalesce(code,'') as code, name, coalesce(location,'') as location, to_char("createdAt",'DD Mon YYYY') as created
         from "warehouses" where "companyId" = $1 order by name asc limit 200`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

/** Create a warehouse / location. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const id = randomUUID();
  try {
    await pool(url).query(
      `insert into "warehouses" (id,"companyId",name,code,location,"createdAt") values ($1,$2,$3,$4,$5,now())`,
      [id, session.companyId, name, b.code == null ? null : String(b.code), b.location == null ? null : String(b.location)]);
    await logAudit("warehouse.create", { targetType: "warehouse", targetId: id, meta: { name } });
    return NextResponse.json({ ok: true, id });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 }); }
}
