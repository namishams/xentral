import "server-only";
import "../../../../lib/session";
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

/** Catalog items (services & products). Default: active only (line-item picker).
 *  ?all=1 returns every item incl. inactive (products list page). */
export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = new URL(req.url).searchParams.get("all") === "1";
  try {
    const { rows } = await pool(url).query(
      `select id, name, coalesce(description,'') as description, coalesce(sku,'') as sku, coalesce(category,'') as category,
              "unitPrice" as "unitPrice", "vatRate" as "vatRate", kind::text as kind, "isActive" as active
         from "catalog_items" where "companyId" = $1 ${all ? "" : `and "isActive" = true`} order by name asc limit 1000`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}
