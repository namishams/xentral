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

/** Catalog items (services & products). Default: active only (line-item picker).
 *  ?all=1 returns every item incl. inactive (catalog management page). */
export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = new URL(req.url).searchParams.get("all") === "1";
  try {
    const { rows } = await pool(url).query(
      `select id, name, coalesce(description,'') as description, coalesce(sku,'') as sku, coalesce(category,'') as category,
              "unitPrice" as "unitPrice", "vatRate" as "vatRate", kind::text as kind, coalesce(recurring,false) as recurring, "isActive" as active
         from "catalog_items" where "companyId" = $1 ${all ? "" : `and "isActive" = true`} order by name asc limit 1000`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

/** Create a catalog item (service or product). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const kind = typeof b.kind === "string" && ["SERVICE", "PRODUCT"].includes(b.kind) ? b.kind : "SERVICE";
  const id = randomUUID();
  try {
    await pool(url).query(
      `insert into "catalog_items" (id, name, description, sku, category, "unitPrice", "vatRate", kind, recurring, "isActive", "companyId", "createdAt", "updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8::"ItemKind",$9,$10,$11, now(), now())`,
      [id, name,
        b.description == null ? null : String(b.description),
        b.sku == null ? null : String(b.sku),
        b.category == null ? null : String(b.category),
        Number(b.unitPrice) || 0,
        Number(b.vatRate) || 0,
        kind,
        typeof b.recurring === "boolean" ? b.recurring : false,
        typeof b.active === "boolean" ? b.active : true,
        session.companyId]);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 });
  }
}
