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
const newId = () => "es" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/** GET — current SMTP settings (password masked). */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ settings: null });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select "smtpHost","smtpPort","smtpUser","smtpFrom","smtpFromName","smtpSecure",
              (case when "smtpPass" is not null and "smtpPass" <> '' then true else false end) as "hasPass"
         from "email_settings" where "companyId" = $1`, [session.companyId]);
    const r = rows[0] || null;
    const envFallback = !!process.env.SMTP_HOST;
    return NextResponse.json({ settings: r, envFallback });
  } catch { return NextResponse.json({ settings: null }); }
}

/** PATCH — upsert SMTP settings. Password only changed when a new one is supplied. */
export async function PATCH(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const fromName = String(b.smtpFromName ?? "").trim();
  const from = String(b.smtpFrom ?? "").trim();
  const host = String(b.smtpHost ?? "").trim();
  const port = Number(b.smtpPort) || 587;
  const user = String(b.smtpUser ?? "").trim();
  const secure = !!b.smtpSecure;
  const passProvided = typeof b.smtpPass === "string" && (b.smtpPass as string).length > 0;
  const pass = passProvided ? String(b.smtpPass) : null;
  if (from && !/.+@.+\..+/.test(from)) return NextResponse.json({ error: "From email looks invalid" }, { status: 400 });

  const p = pool(url);
  try {
    const ex = await p.query(`select id from "email_settings" where "companyId" = $1`, [session.companyId]);
    if (ex.rows[0]) {
      if (passProvided) {
        await p.query(
          `update "email_settings" set "smtpFromName"=$1,"smtpFrom"=$2,"smtpHost"=$3,"smtpPort"=$4,"smtpUser"=$5,"smtpSecure"=$6,"smtpPass"=$7,"updatedAt"=now() where "companyId"=$8`,
          [fromName, from || null, host || null, port, user || null, secure, pass, session.companyId]);
      } else {
        await p.query(
          `update "email_settings" set "smtpFromName"=$1,"smtpFrom"=$2,"smtpHost"=$3,"smtpPort"=$4,"smtpUser"=$5,"smtpSecure"=$6,"updatedAt"=now() where "companyId"=$7`,
          [fromName, from || null, host || null, port, user || null, secure, session.companyId]);
      }
    } else {
      await p.query(
        `insert into "email_settings" (id,"companyId","smtpFromName","smtpFrom","smtpHost","smtpPort","smtpUser","smtpSecure","smtpPass","createdAt","updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [newId(), session.companyId, fromName, from || null, host || null, port, user || null, secure, pass]);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 });
  }
}
