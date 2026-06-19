import "server-only";
import "../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import nodemailer from "nodemailer";
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

type Smtp = { host: string; port: number; user: string; pass: string; from: string; fromName: string; secure: boolean };
async function resolveSmtp(url: string, companyId: string): Promise<Smtp | null> {
  try {
    const { rows } = await pool(url).query(`select "smtpHost","smtpPort","smtpUser","smtpPass","smtpFrom","smtpFromName","smtpSecure" from "email_settings" where "companyId" = $1`, [companyId]);
    const r = rows[0];
    if (r?.smtpHost && r?.smtpUser && r?.smtpPass) {
      return { host: r.smtpHost, port: r.smtpPort || 587, user: r.smtpUser, pass: r.smtpPass, from: r.smtpFrom || r.smtpUser, fromName: r.smtpFromName || "", secure: !!r.smtpSecure };
    }
  } catch { /* env fallback */ }
  const h = process.env.SMTP_HOST, p = process.env.SMTP_PORT, u = process.env.SMTP_USER, pw = process.env.SMTP_PASS;
  if (h && p && u && pw) return { host: h, port: parseInt(p, 10), user: u, pass: pw, from: process.env.SMTP_FROM || u, fromName: process.env.SMTP_FROM_NAME || "", secure: parseInt(p, 10) === 465 };
  return null;
}

/** POST — send a test email to the signed-in user (or ?to). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let to = "";
  try { const b = await req.json(); to = String(b?.to ?? "").trim(); } catch { /* optional body */ }
  if (!to) {
    try { const r = await pool(url).query(`select email from "users" where id = $1`, [session.userId]); to = String(r.rows[0]?.email || "").trim(); } catch { /* noop */ }
  }
  if (!to || !/.+@.+\..+/.test(to)) return NextResponse.json({ error: "No valid recipient. Add your email to your profile or pass one." }, { status: 400 });

  const smtp = await resolveSmtp(url, session.companyId);
  if (!smtp) return NextResponse.json({ error: "No SMTP configured. Fill in the SMTP fields and save first." }, { status: 400 });

  const fromHeader = smtp.fromName ? `${smtp.fromName} <${smtp.from}>` : smtp.from;
  try {
    const t = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass } });
    await t.sendMail({
      from: fromHeader, to,
      subject: "Xentral test email ✓",
      html: `<div style="font-family:Inter,Arial,sans-serif;color:#1d2d3e"><h2 style="color:#0064d9;margin:0 0 6px">Your email is working ✓</h2><p style="color:#556b82;font-size:14px">This is a test message sent from <strong>${fromHeader.replace(/</g, "&lt;")}</strong> via your configured SMTP server. Sender name and address are set up correctly.</p></div>`,
      text: "Your Xentral email setup is working. This test was sent via your configured SMTP server.",
    });
    return NextResponse.json({ ok: true, to, from: fromHeader });
  } catch (e) {
    return NextResponse.json({ error: "Send failed: " + (e instanceof Error ? e.message.slice(0, 200) : "unknown") }, { status: 502 });
  }
}
