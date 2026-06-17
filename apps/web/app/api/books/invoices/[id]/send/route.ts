import "server-only";
import "../../../../../../lib/session";
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
const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function smtp(p: Pool, companyId: string) {
  try {
    const { rows } = await p.query(`select "smtpHost","smtpPort","smtpUser","smtpPass","smtpFrom","smtpFromName","smtpSecure" from "email_settings" where "companyId" = $1`, [companyId]);
    const r = rows[0];
    if (r?.smtpHost && r?.smtpUser && r?.smtpPass) return { host: r.smtpHost, port: r.smtpPort || 587, user: r.smtpUser, pass: r.smtpPass, from: r.smtpFrom || r.smtpUser, fromName: r.smtpFromName || "", secure: !!r.smtpSecure };
  } catch { /* env fallback */ }
  const h = process.env.SMTP_HOST, pt = process.env.SMTP_PORT, u = process.env.SMTP_USER, pw = process.env.SMTP_PASS;
  if (h && pt && u && pw) return { host: h, port: parseInt(pt, 10), user: u, pass: pw, from: process.env.SMTP_FROM || u, fromName: process.env.SMTP_FROM_NAME || "", secure: parseInt(pt, 10) === 465 };
  return null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "app.xentral.ae";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const payUrl = `${proto}://${host}/pay/${params.id}`;

  const p = pool(url);
  let inv, settings;
  try {
    const r = await p.query(
      `select i.number, i.status::text as status, i.total, i.currency, to_char(i."dueDate",'DD Mon YYYY') as due, bc.name as customer, bc.email as email
         from "invoices" i left join "billing_customers" bc on bc.id = i."customerId" where i.id = $1 and i."companyId" = $2`, [params.id, session.companyId]);
    inv = r.rows[0];
    const s = await p.query(`select "legalName","logoUrl","templateConfig","footerNotes" from "billing_settings" where "companyId" = $1`, [session.companyId]);
    settings = s.rows[0] || {};
  } catch { return NextResponse.json({ error: "Lookup failed" }, { status: 500 }); }
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!inv.email || !/.+@.+\..+/.test(inv.email)) return NextResponse.json({ error: "Customer has no email address. Add one on the customer first." }, { status: 400 });

  const cfg = await smtp(p, session.companyId);
  if (!cfg) return NextResponse.json({ error: "No mailbox configured (Settings → Email)." }, { status: 400 });

  const accent = (settings.templateConfig && settings.templateConfig.accent) || "#0064d9";
  const merchant = settings.legalName || cfg.fromName || "Xentral";
  const total = aed(inv.total, inv.currency);
  const subject = `Invoice ${inv.number} from ${merchant}`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d2733">
    ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${merchant}" style="height:38px;margin-bottom:12px"/>` : `<div style="font-size:20px;font-weight:800;color:${accent};margin-bottom:12px">${merchant}</div>`}
    <p style="font-size:15px">Dear ${inv.customer || "customer"},</p>
    <p style="font-size:14px;color:#5b6b7b">Please find your invoice <b>${inv.number}</b>${inv.due ? ` due on ${inv.due}` : ""}.</p>
    <div style="background:#f6f9fb;border:1px solid #e4e9ef;border-radius:12px;padding:18px;margin:16px 0">
      <div style="font-size:13px;color:#5b6b7b">Amount due</div>
      <div style="font-size:30px;font-weight:800;color:${accent}">${total}</div>
    </div>
    <a href="${payUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 26px;border-radius:10px">Pay ${total} securely</a>
    <p style="font-size:12px;color:#8a97a5;margin-top:14px">Payments are processed securely by Telr.</p>
    ${settings.footerNotes ? `<p style="font-size:12px;color:#5b6b7b;border-top:1px solid #e4e9ef;padding-top:12px;margin-top:16px">${settings.footerNotes}</p>` : ""}
  </div>`;

  let status = "SENT"; let error: string | null = null;
  try {
    const t = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: cfg.user, pass: cfg.pass } });
    await t.sendMail({ from: cfg.fromName ? `${cfg.fromName} <${cfg.from}>` : cfg.from, to: inv.email, subject, html });
  } catch (e) { status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 200) : "send error"; }

  try { await p.query(`insert into "email_messages" (id,"companyId",subject,body,"fromEmail","toEmail","toName",status,error,"sentAt","createdAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`, [newId(), session.companyId, subject, html, cfg.from, inv.email, inv.customer || null, status, error]); } catch { /* best effort */ }

  if (status === "FAILED") return NextResponse.json({ error: "Could not send: " + error }, { status: 502 });
  try { if (inv.status === "DRAFT") await p.query(`update "invoices" set status='SENT'::"InvoiceStatus", "sentAt"=now(), "updatedAt"=now() where id=$1 and "companyId"=$2`, [params.id, session.companyId]); } catch { /* status best effort */ }
  return NextResponse.json({ ok: true, to: inv.email });
}
