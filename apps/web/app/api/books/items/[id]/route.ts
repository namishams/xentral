import "server-only";
import "../../../../../lib/session";
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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, name, coalesce(description,'') as description, coalesce(sku,'') as sku, coalesce(category,'') as category,
              "unitPrice" as "unitPrice", "vatRate" as "vatRate", kind::text as kind, recurring, "isActive" as active,
              to_char("createdAt",'DD Mon YYYY') as created, to_char("updatedAt",'DD Mon YYYY') as updated
         from "catalog_items" where id = $1 and "companyId" = $2 limit 1`, [params.id, session.companyId]);
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item: rows[0] });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  if (typeof b.name === "string" && b.name.trim()) { sets.push(`name = $${i}`); vals.push(b.name.trim()); i++; }
  if ("description" in b) { sets.push(`description = $${i}`); vals.push(b.description == null ? null : String(b.description)); i++; }
  if ("sku" in b) { sets.push(`sku = $${i}`); vals.push(b.sku == null ? null : String(b.sku)); i++; }
  if ("category" in b) { sets.push(`category = $${i}`); vals.push(b.category == null ? null : String(b.category)); i++; }
  if ("unitPrice" in b) { sets.push(`"unitPrice" = $${i}`); vals.push(Number(b.unitPrice) || 0); i++; }
  if ("vatRate" in b) { sets.push(`"vatRate" = $${i}`); vals.push(Number(b.vatRate) || 0); i++; }
  if (typeof b.kind === "string" && ["SERVICE", "PRODUCT"].includes(b.kind)) { sets.push(`kind = $${i}::"ItemKind"`); vals.push(b.kind); i++; }
  if (typeof b.recurring === "boolean") { sets.push(`recurring = $${i}`); vals.push(b.recurring); i++; }
  if (typeof b.active === "boolean") { sets.push(`"isActive" = $${i}`); vals.push(b.active); i++; }
  if (sets.length === 0) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
  sets.push(`"updatedAt" = now()`);
  vals.push(params.id, session.companyId);
  try {
    const r = await pool(url).query(`update "catalog_items" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
    if (r.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await pool(url).query(`delete from "catalog_items" where id = $1 and "companyId" = $2`, [params.id, session.companyId]);
    if (r.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    // If referenced by invoices/quotes, soft-delete (deactivate) instead of hard delete.
    try {
      await pool(url).query(`update "catalog_items" set "isActive" = false, "updatedAt" = now() where id = $1 and "companyId" = $2`, [params.id, session.companyId]);
      return NextResponse.json({ ok: true, deactivated: true });
    } catch {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
  }
}
