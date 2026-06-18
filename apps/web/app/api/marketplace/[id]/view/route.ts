import "server-only";
import "../../../../../lib/session"; // side-effect: register SessionPort resolver
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

/** Increment a lead's view counter (fire-and-forget on card open). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ ok: true });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ ok: true });
  try {
    await pool(url).query(`update "marketplace_leads" set "viewCount" = "viewCount" + 1 where id = $1`, [params.id]);
  } catch { /* best-effort */ }
  return NextResponse.json({ ok: true });
}
