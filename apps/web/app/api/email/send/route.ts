import "server-only";
import "../../../../lib/session";
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
const newId = () => "em" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

type Smtp = { host: string; port: number; user: string; pass: string; from: string; fromName: string; secure: boolean };

async function resolveSmtp(url: string, companyId: string): Promise<Smtp | null> {
  try {
    const { rows } = await pool(url).query(`select "smtpHost","smtpPort","smtpUser","smtpPass","smtpFrom","smtpFromName","smtpSecure" from "email_settings" where "companyId" = $1`, [companyId]);
    const r = rows[0];
    if (r?.smtpHost && r?.smtpUser && r?.smtpPass) {
      return { host: r.smtpHost, port: r.smtpPort || 587, user: r.smtpUser, pass: r.smtpPass, from: r.smtpFrom || r.smtpUser, fromName: r.smtpFromName || "", secure: !!r.smtpSecure };
    }
  } catch { /* fall through to env */ }
  const h = process.env.SMTP_HOST, p = process.env.SMTP_PORT, u = process.env.SMTP_USER, pw = process.env.SMTP_PASS;
  if (h && p && u && pw) return { host: h, port: parseInt(p, 10), user: u, pass: pw, from: process.env.SMTP_FROM || u, fromName: process.env.SMTP_FROM_NAME || "", secure: parseInt(p, 10) === 465 };
  return null;
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const to = String(b.to ?? "").trim();
  const subject = String(b.subject ?? "").trim();
  const body = String(b.body ?? "");
  if (!to || !/.+@.+\..+/.test(to)) return NextResponse.json({ error: "Valid recipient email required" }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "Subject required" }, { status: 400 });

  const smtp = await resolveSmtp(url, session.companyId);
  if (!smtp) return NextResponse.json({ error: "No mailbox configured. Add SMTP in Settings → Email." }, { status: 400 });

  const fromHeader = smtp.fromName ? `${smtp.fromName} <${smtp.from}>` : smtp.from;
  let status = "SENT"; let error: string | null = null;
  try {
    const t = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass } });
    await t.sendMail({ from: fromHeader, to, subject, html: body.replace(/\n/g, "<br>"), text: body });
  } catch (e) {
    status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 200) : "send error";
  }
  try {
    await pool(url).query(
      `insert into "email_messages" (id,"companyId",subject,body,"fromEmail","toEmail","toName",status,error,"sentAt","createdAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
      [newId(), session.companyId, subject, body, smtp.from, to, String(b.toName ?? "") || null, status, error]);
  } catch { /* logging best-effort */ }

  if (status === "FAILED") return NextResponse.json({ error: "Could not send: " + error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
