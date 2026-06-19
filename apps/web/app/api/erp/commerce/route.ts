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
const N = (v: unknown) => Number(v) || 0;

/** Commerce orders (online channels) — KPIs + recent orders. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [], kpis: {} });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = (await p_query(url, session.companyId)).rows;
    const orders = rows.map((r) => ({
      id: r.id, number: r.number || "—", customer: r.customerName || r.customerEmail || "Guest",
      total: N(r.total), currency: r.currency || "AED", status: String(r.status || "").toUpperCase(),
      fulfilment: String(r.fulfilmentStatus || "").toUpperCase(), placedAt: r.placedAt,
      date: r.placedAt ? new Date(r.placedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    }));
    const gmv = orders.reduce((s, o) => s + o.total, 0);
    const byStatus = Array.from(orders.reduce((mp, o) => mp.set(o.status || "—", (mp.get(o.status || "—") || 0) + 1), new Map<string, number>()).entries()).map(([status, count]) => ({ status, count }));
    const unfulfilled = orders.filter((o) => o.fulfilment && !["FULFILLED", "DELIVERED", "SHIPPED"].includes(o.fulfilment)).length;
    return NextResponse.json({
      currency: orders[0]?.currency || "AED",
      kpis: { count: orders.length, gmv, avgOrder: orders.length ? Math.round(gmv / orders.length) : 0, unfulfilled },
      byStatus, rows: orders,
    });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error", rows: [], kpis: {} }); }
}

async function p_query(url: string, cid: string) {
  return pool(url).query(
    `select id, number, "customerName", "customerEmail", total, currency, status::text as status,
            "fulfilmentStatus"::text as "fulfilmentStatus", "placedAt"
       from "commerce_orders" where "companyId" = $1 order by "placedAt" desc nulls last limit 100`, [cid]);
}
