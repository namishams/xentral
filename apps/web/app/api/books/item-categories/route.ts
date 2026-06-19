import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { logAudit } from "../../../..//lib/audit";
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

/** GET — item categories for this workspace (with item counts). */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select c.id, c.name, coalesce(c.code,'') as code, coalesce(c."itemType",'') as "itemType", coalesce(c.industry,'') as industry, c."vatRate" as "vatRate",
              (select count(*)::int from "catalog_items" ci where ci."companyId" = $1 and ci.category = c.name) as "itemCount"
         from "item_categories" c where c."companyId" = $1 order by c."sortOrder" asc nulls last, c.name asc limit 500`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

/** POST — create a category (idempotent on name). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const itemType = typeof b.itemType === "string" && ["SERVICE", "PRODUCT"].includes(b.itemType) ? b.itemType : null;
  const vatRate = b.vatRate == null || b.vatRate === "" ? null : Number(b.vatRate);
  const p = pool(url);
  try {
    const ex = await p.query(`select id from "item_categories" where "companyId" = $1 and lower(name) = lower($2) limit 1`, [session.companyId, name]);
    if (ex.rows[0]) return NextResponse.json({ ok: true, id: ex.rows[0].id, existed: true });
    const id = randomUUID();
    await p.query(
      `insert into "item_categories" (id,"companyId",name,code,"itemType",industry,"vatRate","createdAt") values ($1,$2,$3,$4,$5,$6,$7,now())`,
      [id, session.companyId, name, b.code == null ? null : String(b.code), itemType, b.industry == null || b.industry === "" ? null : String(b.industry), vatRate]);
    await logAudit("category.create", { targetType: "category", targetId: id, meta: { name } });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 });
  }
}

/** DELETE — remove a category (?id=). Items keep their text category. */
export async function DELETE(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await pool(url).query(`delete from "item_categories" where id = $1 and "companyId" = $2`, [id, session.companyId]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
