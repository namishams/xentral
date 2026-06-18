import "server-only";
import "../../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { resolveSession } from "@xentral/kernel";
import { generateDocumentPdf } from "../../../../../../lib/books-pdf";
import { buildQuotePdfData } from "../../../../../../lib/books-doc";

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
  } catch { /* env */ }
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

  const p = pool(url);
  let q, settings, company;
  try {
    const r = await p.query(
      `select q.number, q.status::text as status, q."issueDate" as "issueDate", q."validUntil" as "validUntil",
              q.subtotal, q."discountTotal" as "discountTotal", q."vatTotal" as "vatTotal", q.total, q.currency, q.notes, q.terms, q."publicToken" as token,
              to_char(q."validUntil",'DD Mon YYYY') as valid,
              bc.name as customer, bc."legalName" as "clegalName", bc.email as email, bc.phone as "cphone",
              bc."addressLine1" as "caddr1", bc."addressLine2" as "caddr2", bc.city as "ccity", bc.country as "ccountry", bc."vatNumber" as "cvat"
         from "quotes" q left join "billing_customers" bc on bc.id = q."customerId" where q.id = $1 and q."companyId" = $2`, [params.id, session.companyId]);
    q = r.rows[0];
    settings = (await p.query(`select * from "billing_settings" where "companyId" = $1`, [session.companyId])).rows[0] || {};
    company = (await p.query(`select name from "companies" where id = $1 limit 1`, [session.companyId])).rows[0] || { name: "Xentral" };
  } catch { return NextResponse.json({ error: "Lookup failed" }, { status: 500 }); }
  if (!q) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (!q.email || !/.+@.+\..+/.test(q.email)) return NextResponse.json({ error: "Customer has no email address." }, { status: 400 });

  const cfg = await smtp(p, session.companyId);
  if (!cfg) return NextResponse.json({ error: "No mailbox configured (Settings → Email)." }, { status: 400 });

  const viewUrl = `${proto}://${host}/q/${q.token}`;
  const accent = (settings.templateConfig && (settings.templateConfig.accent || settings.templateConfig.accentColor)) || "#0064d9";
  const merchant = settings.legalName || cfg.fromName || "Xentral";
  const total = aed(q.total, q.currency);
  const subject = `Quotation ${q.number} from ${merchant}`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d2733">
    ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${merchant}" style="height:38px;margin-bottom:12px"/>` : `<div style="font-size:20px;font-weight:800;color:${accent};margin-bottom:12px">${merchant}</div>`}
    <p style="font-size:15px">Dear ${q.customer || "customer"},</p>
    <p style="font-size:14px;color:#5b6b7b">Please find your quotation <b>${q.number}</b> for <b>${total}</b>${q.valid ? `, valid until ${q.valid}` : ""}. The PDF is attached.</p>
    <a href="${viewUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 26px;border-radius:10px;margin-top:6px">View &amp; accept quote</a>
    ${settings.footerNotes ? `<p style="font-size:12px;color:#5b6b7b;border-top:1px solid #e4e9ef;padding-top:12px;margin-top:16px">${settings.footerNotes}</p>` : ""}
  </div>`;

  // build the A4 PDF attachment (best-effort)
  let attachments: { filename: string; content: Buffer }[] | undefined;
  try {
    const lines = (await p.query(`select name, description, qty, "unitPrice", "vatRate", "discountPct", "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [params.id])).rows;
    const data = buildQuotePdfData({
      number: q.number, issueDate: q.issueDate, validUntil: q.validUntil, status: q.status, currency: q.currency || "AED",
      subtotal: q.subtotal, discountTotal: q.discountTotal, vatTotal: q.vatTotal, total: q.total, notes: q.notes, terms: q.terms,
      customer: { name: q.customer || "Customer", legalName: q.clegalName, email: q.email, phone: q.cphone, addressLine1: q.caddr1, addressLine2: q.caddr2, city: q.ccity, country: q.ccountry, vatNumber: q.cvat },
      lines,
    }, settings, company.name || "Xentral");
    const pdf = await generateDocumentPdf(data);
    attachments = [{ filename: `${q.number}.pdf`, content: pdf }];
  } catch { attachments = undefined; }

  let status = "SENT"; let error: string | null = null;
  try {
    const t = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: cfg.user, pass: cfg.pass } });
    await t.sendMail({ from: cfg.fromName ? `${cfg.fromName} <${cfg.from}>` : cfg.from, to: q.email, subject, html, attachments });
  } catch (e) { status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 200) : "send error"; }
  try { await p.query(`insert into "email_messages" (id,"companyId",subject,body,"fromEmail","toEmail","toName",status,error,"sentAt","createdAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`, [newId(), session.companyId, subject, html, cfg.from, q.email, q.customer || null, status, error]); } catch { /* best effort */ }
  if (status === "FAILED") return NextResponse.json({ error: "Could not send: " + error }, { status: 502 });
  try { if (q.status === "DRAFT") await p.query(`update "quotes" set status='SENT'::"QuoteStatus", "sentAt"=now(), "updatedAt"=now() where id=$1 and "companyId"=$2`, [params.id, session.companyId]); } catch { /* best effort */ }
  return NextResponse.json({ ok: true, to: q.email });
}
