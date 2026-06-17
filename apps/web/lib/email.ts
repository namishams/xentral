import "server-only";
import nodemailer from "nodemailer";

/**
 * E-mail function — ported from the live app. DORMANT until SMTP env is set
 * (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Without it, sendMail
 * is a safe no-op so the public preview never sends mail. The same SMTP_* vars
 * the existing app uses just need to be present on the host at go-live.
 */

function transport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;
  return nodemailer.createTransport({ host, port: parseInt(port, 10), secure: parseInt(port, 10) === 465, auth: { user, pass } });
}

export type MailInput = { to: string; subject: string; html: string; replyTo?: string };

/** Send an e-mail. Returns { sent } — false (no throw) when SMTP isn't configured. */
export async function sendMail({ to, subject, html, replyTo }: MailInput): Promise<{ sent: boolean }> {
  const t = transport();
  if (!t) return { sent: false };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    await t.sendMail({ from, to, subject, html, replyTo });
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

export type PurchaseMail = {
  buyerEmail: string;
  buyerName: string;
  companyName: string;
  lead: {
    firstName?: string | null; lastName?: string | null; specialty?: string | null; category?: string | null;
    phone?: string | null; email?: string | null; linkedIn?: string | null; originCountry?: string | null;
    yearsExperience?: number | null; quality?: string | null;
  };
  pricePaid: number;
  purchaseId: string;
};

const esc = (s?: string | null) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

/** Purchase confirmation — unlocked lead contact, matching the live app's email. */
export async function sendPurchaseConfirmation(opts: PurchaseMail): Promise<{ sent: boolean }> {
  const l = opts.lead;
  const name = [l.firstName, l.lastName].filter(Boolean).join(" ") || l.specialty || "Lead";
  const row = (label: string, val?: string | null) => val ? `<tr><td style="padding:6px 12px;color:#556b82;font-size:13px">${label}</td><td style="padding:6px 12px;color:#1d2d3e;font-size:13px;font-weight:600">${esc(val)}</td></tr>` : "";
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1d2d3e">
    <h2 style="color:#0064d9;margin:0 0 4px">Lead unlocked ✓</h2>
    <p style="color:#556b82;font-size:14px;margin:0 0 16px">Hi ${esc(opts.buyerName)}, your purchase for <strong>${esc(opts.companyName)}</strong> is confirmed. Contact details below.</p>
    <table style="width:100%;border:1px solid #e5e5e5;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden">
      ${row("Name", name)}
      ${row("Specialty", l.specialty)}
      ${row("Category", l.category)}
      ${row("Phone", l.phone)}
      ${row("Email", l.email)}
      ${row("LinkedIn", l.linkedIn)}
      ${row("Origin", l.originCountry)}
      ${row("Experience", l.yearsExperience != null ? `${l.yearsExperience} years` : null)}
    </table>
    <p style="color:#556b82;font-size:12px;margin:16px 0 0">Paid: AED ${opts.pricePaid.toLocaleString()} · Purchase #${esc(opts.purchaseId)}</p>
    <p style="color:#8396a8;font-size:12px;margin:8px 0 0">24-hour dispute window applies. — Xentral</p>
  </div>`;
  return sendMail({ to: opts.buyerEmail, subject: `Lead unlocked: ${name}`, html });
}
