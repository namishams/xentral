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

/** Place a bid / offer on a marketplace lead. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const amount = Number(b.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid offer amount" }, { status: 400 });
  const p = pool(url); const leadId = params.id;
  try {
    const lead = await p.query(`select id, status::text as status from "marketplace_leads" where id = $1 limit 1`, [leadId]);
    if (!lead.rows[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.rows[0].status !== "AVAILABLE") return NextResponse.json({ error: "Lead no longer available" }, { status: 409 });
    const dup = await p.query(`select id from "marketplace_bids" where "leadId" = $1 and "companyId" = $2 and status = 'PENDING' limit 1`, [leadId, session.companyId]);
    if (dup.rowCount) {
      await p.query(`update "marketplace_bids" set amount = $1, message = $2, "updatedAt" = now() where id = $3`, [amount, b.message == null ? null : String(b.message), dup.rows[0].id]);
      return NextResponse.json({ ok: true, updated: true, amount });
    }
    await p.query(`insert into "marketplace_bids" (id, amount, message, status, "leadId", "companyId", "createdAt", "updatedAt") values ($1,$2,$3,'PENDING',$4,$5, now(), now())`,
      [randomUUID(), amount, b.message == null ? null : String(b.message), leadId, session.companyId]);
    return NextResponse.json({ ok: true, amount });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
