import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool, type PoolClient } from "pg";
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

type Row = Record<string, string>;
const g = (r: Row, k: string) => (r[k] == null ? "" : String(r[k]).trim());

type Importer = (c: PoolClient, companyId: string, r: Row) => Promise<boolean>;

const IMPORTERS: Record<string, Importer> = {
  items: async (c, cid, r) => {
    const name = g(r, "name");
    const price = Number(g(r, "unit price"));
    if (!name || isNaN(price) || price < 0) return false;
    const vatRaw = g(r, "vat %"); const vat = vatRaw === "" ? 5 : Number(vatRaw);
    const kind = g(r, "type").toUpperCase() === "PRODUCT" ? "PRODUCT" : "SERVICE";
    await c.query(
      `insert into "catalog_items" (id, name, description, sku, category, "unitPrice", "vatRate", kind, recurring, "isActive", "companyId", "createdAt", "updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8::"ItemKind",false,true,$9, now(), now())`,
      [randomUUID(), name, g(r, "description") || null, g(r, "sku") || null, g(r, "category") || null, price, isNaN(vat) ? 5 : vat, kind, cid]);
    return true;
  },
  customers: async (c, cid, r) => {
    const name = g(r, "name"); if (!name) return false;
    const email = g(r, "email") || null;
    await c.query(
      `insert into "billing_customers" (id,"companyId",name,"displayName",email,"createdAt","updatedAt") values ($1,$2,$3,$3,$4,now(),now())`,
      [randomUUID(), cid, name, email]);
    return true;
  },
  contacts: async (c, cid, r) => {
    let first = g(r, "first name"); let last = g(r, "last name");
    if (!first && !last) { const nm = g(r, "name"); if (nm) { const parts = nm.split(/\s+/); first = parts[0] ?? ""; last = parts.slice(1).join(" "); } }
    if (!first && !last) return false;
    await c.query(
      `insert into "contacts" (id,"firstName","lastName",email,phone,title,"companyId",status,"isArchived","createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,'NEW',false,now(),now())`,
      [randomUUID(), first || "Contact", last || null, g(r, "email") || null, g(r, "phone") || null, g(r, "title") || null, cid]);
    return true;
  },
};

export async function POST(req: Request, { params }: { params: { entity: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fn = IMPORTERS[params.entity];
  if (!fn) return NextResponse.json({ error: "Unknown import target" }, { status: 404 });
  let b: { rows?: Row[] };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (rows.length === 0) return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  if (rows.length > 5000) return NextResponse.json({ error: "Too many rows (max 5000)" }, { status: 400 });

  const client = await pool(url).connect();
  let created = 0, skipped = 0;
  try {
    await client.query("BEGIN");
    for (const r of rows) { try { (await fn(client, session.companyId, r)) ? created++ : skipped++; } catch { skipped++; } }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, created, skipped });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* noop */ }
    return NextResponse.json({ error: (e as Error).message || "Import failed" }, { status: 500 });
  } finally { client.release(); }
}
