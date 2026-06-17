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
const newId = () => "bs" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const TEXT = ["legalName", "addressLine1", "addressLine2", "city", "country", "vatNumber", "tradeLicenseNo", "email", "phone", "website", "logoUrl", "bankName", "accountName", "iban", "swift", "paymentInstructions", "footerNotes", "defaultTerms", "currency", "invoicePrefix", "quotePrefix"] as const;

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ settings: {} });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(`select * from "billing_settings" where "companyId" = $1 limit 1`, [session.companyId]);
    return NextResponse.json({ settings: rows[0] ?? {} });
  } catch { return NextResponse.json({ settings: {} }); }
}

export async function PUT(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const cols: string[] = [];
  const vals: unknown[] = [];
  for (const k of TEXT) { if (k in b) { cols.push(k); vals.push(b[k] == null ? null : String(b[k])); } }
  const hasTpl = "templateConfig" in b;
  try {
    const p = pool(url);
    const existing = await p.query(`select id from "billing_settings" where "companyId" = $1`, [session.companyId]);
    if (existing.rows[0]) {
      const sets = cols.map((c, i) => `"${c}" = $${i + 1}`);
      let idx = cols.length + 1;
      if (hasTpl) { sets.push(`"templateConfig" = $${idx}::jsonb`); vals.push(JSON.stringify(b.templateConfig)); idx++; }
      sets.push(`"updatedAt" = now()`);
      vals.push(session.companyId);
      await p.query(`update "billing_settings" set ${sets.join(", ")} where "companyId" = $${idx}`, vals);
    } else {
      const allCols = ["id", "companyId", ...cols]; const ph = allCols.map((_, i) => `$${i + 1}`);
      const params: unknown[] = [newId(), session.companyId, ...vals];
      if (hasTpl) { allCols.push(`templateConfig`); ph.push(`$${allCols.length}::jsonb`); params.push(JSON.stringify(b.templateConfig)); }
      await p.query(`insert into "billing_settings" (${allCols.map((c) => `"${c}"`).join(",")}, "createdAt","updatedAt") values (${ph.join(",")}, now(), now())`, params);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
