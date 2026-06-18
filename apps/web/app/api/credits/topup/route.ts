import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Platform bank account — top-ups are settled by bank transfer, then the
// operator approves the request in the Admin console (credit.approve).
const BANK_DETAILS = {
  bankName: "WIO Bank",
  accountName: "ICSL FZE",
  iban: "AE930860000009201081224",
  swift: "WIOBAEADXXX",
  currency: "AED",
  minAmount: 1000,
};

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

/** GET — bank details + balance + recent top-up requests + credit ledger. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ bankDetails: BANK_DETAILS, credits: 0, topups: [], transactions: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ bankDetails: BANK_DETAILS, credits: 0, topups: [], transactions: [] });
  const p = pool(url);
  try {
    const [comp, topups, txns] = await Promise.all([
      p.query(`select coalesce(credits,0)::int as credits, name from "companies" where id = $1`, [session.companyId]),
      p.query(`select id, amount, status, reference, "createdAt" from "credit_topup_requests" where "companyId" = $1 order by "createdAt" desc limit 10`, [session.companyId]),
      p.query(`select id, amount, type, description, "balanceBefore", "balanceAfter", "createdAt" from "credit_transactions" where "companyId" = $1 order by "createdAt" desc limit 150`, [session.companyId]),
    ]);
    return NextResponse.json({ bankDetails: BANK_DETAILS, credits: comp.rows[0]?.credits ?? 0, topups: topups.rows, transactions: txns.rows });
  } catch {
    return NextResponse.json({ bankDetails: BANK_DETAILS, credits: 0, topups: [], transactions: [] });
  }
}

/** POST — request a credit top-up (min AED 1,000). Operator approves it in Admin. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const amount = Number(b.amount);
  if (!amount || amount < 1000) return NextResponse.json({ error: "Minimum top-up is AED 1,000" }, { status: 400 });
  try {
    const id = randomUUID();
    await pool(url).query(
      `insert into "credit_topup_requests" (id, "companyId", amount, status, reference, "createdAt", "updatedAt") values ($1,$2,$3,'PENDING',$4, now(), now())`,
      [id, session.companyId, amount, b.reference == null ? null : String(b.reference)]);
    return NextResponse.json({ success: true, id, bankDetails: BANK_DETAILS });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
