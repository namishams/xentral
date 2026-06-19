import "server-only";
import "../../../../../lib/session";
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

type InRow = { name?: unknown; unitPrice?: unknown; vatRate?: unknown; kind?: unknown; description?: unknown; sku?: unknown; category?: unknown };

/** Bulk-create catalog items from a parsed list (name, price, vat, kind, description). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: { items?: InRow[] };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) return NextResponse.json({ error: "No items to import" }, { status: 400 });

  const p = pool(url);
  let created = 0; let skipped = 0;
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    for (const it of items) {
      const name = String(it.name ?? "").trim();
      const price = Number(it.unitPrice);
      if (!name || isNaN(price) || price < 0) { skipped++; continue; }
      const kind = typeof it.kind === "string" && ["SERVICE", "PRODUCT"].includes(it.kind.toUpperCase()) ? it.kind.toUpperCase() : "SERVICE";
      const vat = Number(it.vatRate); const vatRate = isNaN(vat) ? 5 : vat;
      await client.query(
        `insert into "catalog_items" (id, name, description, sku, category, "unitPrice", "vatRate", kind, recurring, "isActive", "companyId", "createdAt", "updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,$8::"ItemKind",false,true,$9, now(), now())`,
        [randomUUID(), name,
          it.description == null ? null : String(it.description),
          it.sku == null ? null : String(it.sku),
          it.category == null ? null : String(it.category),
          price, vatRate, kind, session.companyId]);
      created++;
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, created, skipped });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* noop */ }
    return NextResponse.json({ error: (e as Error).message || "Import failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
