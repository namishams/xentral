import "server-only";
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

function cp(initial: number, minP: number, decayAmount: number, decayInterval: number, listedAt: string): number {
  const hrs = (Date.now() - new Date(listedAt).getTime()) / 3600000;
  const drops = Math.floor(hrs / Math.max(1, decayInterval));
  return Math.max(minP, initial - drops * decayAmount);
}

/** Live marketplace stats: total, hot, exclusive, avg price, by-category, added today. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) {
    return NextResponse.json({ total: 0, hot: 0, exclusive: 0, avgPrice: 0, addedToday: 0, byCategory: {} });
  }
  try {
    const { rows } = await pool(url).query(
      `select category, quality::text as quality, "isExclusive", "initialPrice", "minPrice", "decayAmount", "decayInterval", "listedAt"
         from "marketplace_leads" where status = 'AVAILABLE' and "purchaseCount" < "maxPurchases"`);
    const total = rows.length;
    const hot = rows.filter((r) => String(r.quality).toUpperCase() === "HOT").length;
    const exclusive = rows.filter((r) => r.isExclusive).length;
    const since = Date.now() - 86400000;
    const addedToday = rows.filter((r) => r.listedAt && new Date(r.listedAt).getTime() >= since).length;
    const prices = rows.map((r) => cp(Number(r.initialPrice), Number(r.minPrice), Number(r.decayAmount), Number(r.decayInterval), String(r.listedAt)));
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const byCategory: Record<string, number> = {};
    for (const r of rows) { const c = String(r.category || "Other"); byCategory[c] = (byCategory[c] || 0) + 1; }
    return NextResponse.json({ total, hot, exclusive, avgPrice, addedToday, byCategory });
  } catch {
    return NextResponse.json({ total: 0, hot: 0, exclusive: 0, avgPrice: 0, addedToday: 0, byCategory: {} });
  }
}
