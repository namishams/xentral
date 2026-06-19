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

const ENTITIES = ["contact", "company", "lead", "deal", "customer"];
const KINDS = ["list", "segment"];

/** GET — all lists & segments with member counts. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select l.id, l.name, coalesce(l.description,'') as description, coalesce(l.color,'') as color,
              coalesce(l."entityType",'contact') as "entityType", coalesce(l.kind,'list') as kind, coalesce(l."isPinned",false) as "isPinned",
              (select count(*)::int from "crm_list_members" m where m."listId" = l.id) as "memberCount"
         from "crm_lists" l where l."companyId" = $1 order by l."isPinned" desc, l."sortOrder" asc nulls last, l.name asc limit 500`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

/** POST — create a list or segment. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const entityType = typeof b.entityType === "string" && ENTITIES.includes(b.entityType) ? b.entityType : "contact";
  const kind = typeof b.kind === "string" && KINDS.includes(b.kind) ? b.kind : "list";
  const id = randomUUID();
  try {
    await pool(url).query(
      `insert into "crm_lists" (id,"companyId",name,description,color,"entityType",kind,"isPinned","createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
      [id, session.companyId, name, b.description == null ? null : String(b.description), b.color == null ? null : String(b.color), entityType, kind, b.isPinned === true]);
    await logAudit("list.create", { targetType: "list", targetId: id, meta: { name } });
    return NextResponse.json({ ok: true, id });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 }); }
}

/** DELETE — remove a list (?id=) and its members. */
export async function DELETE(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const p = pool(url);
  try {
    const own = await p.query(`select id from "crm_lists" where id = $1 and "companyId" = $2 limit 1`, [id, session.companyId]);
    if (!own.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await p.query(`delete from "crm_list_members" where "listId" = $1`, [id]);
    await p.query(`delete from "crm_lists" where id = $1 and "companyId" = $2`, [id, session.companyId]);
    await logAudit("list.delete", { targetType: "list", targetId: id });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
