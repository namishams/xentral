import "server-only";
import "../../../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { sendDisputeConfirmationEmail } from "../../../../../../lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

/** Raise a dispute on a purchased lead (e.g. bad number, duplicate). Operator resolves it. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const reason = String(b.reason ?? "").trim();
  if (!reason) return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  const p = pool(url);
  try {
    // ownership check: the purchase must belong to this workspace
    const own = await p.query(`select id from "marketplace_purchases" where id = $1 and "companyId" = $2 limit 1`, [params.id, session.companyId]);
    if (!own.rowCount) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    const dup = await p.query(`select id from "lead_disputes" where "purchaseId" = $1 limit 1`, [params.id]);
    if (dup.rowCount) return NextResponse.json({ error: "A dispute is already open for this lead." }, { status: 409 });
    const id = randomUUID();
    await p.query(
      `insert into "lead_disputes" (id, "purchaseId", "companyId", reason, details, status, "createdAt", "updatedAt") values ($1,$2,$3,$4,$5,'OPEN', now(), now())`,
      [id, params.id, session.companyId, reason, b.details == null ? null : String(b.details)]);
    try {
      const info = (await p.query(`select u.email, u.name, l.specialty from "marketplace_purchases" mp join "marketplace_leads" l on l.id = mp."leadId" join "users" u on u.id = $2 where mp.id = $1 limit 1`, [params.id, session.userId])).rows[0];
      if (info?.email) await sendDisputeConfirmationEmail({ to: String(info.email), name: String(info.name || "there"), leadSpecialty: String(info.specialty || "Lead"), reason, purchaseId: params.id });
    } catch { /* noop */ }
    return NextResponse.json({ success: true, id });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
