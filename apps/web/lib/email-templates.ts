import "server-only";
import nodemailer from "nodemailer";

const _smtp = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;
const _real = _smtp ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT as string), secure: parseInt(process.env.SMTP_PORT as string) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }) : null;
const transporter = { sendMail: async (o: nodemailer.SendMailOptions) => { if (!_real) return; try { await _real.sendMail(o); } catch { /* noop */ } } };

// ── Shared HTML wrapper ─────────────────────────────────────────────────────
function wrap(body: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>Xentral</title>
</head>
<body style="margin:0;padding:0;background:#eef0f2;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:40px 12px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e7ea;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(20,28,38,0.04);">
      <!-- Header -->
      <tr><td style="padding:24px 40px 18px;border-bottom:1px solid #eef0f2;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;padding-right:9px;"><img src="https://app.xentral.ae/icon-192.png" width="30" height="30" alt="" style="display:block;border:0;border-radius:7px;" /></td>
          <td style="vertical-align:middle;"><span style="font-size:21px;font-weight:800;color:#16202c;letter-spacing:-0.6px;">xentral</span><span style="font-size:11px;color:#8a93a0;font-weight:600;letter-spacing:0.2px;margin-left:9px;">UAE business operating system</span></td>
        </tr></table>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:34px 40px 30px;color:#3a4754;font-size:14px;line-height:1.65;">
        ${body}
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:22px 40px 26px;border-top:1px solid #eef0f2;background:#fafbfc;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#8995a3;letter-spacing:0.5px;text-transform:uppercase;">One platform · from first touch to revenue</p>
        <p style="margin:0 0 14px;font-size:12px;color:#8995a3;">CRM &nbsp;·&nbsp; Exchange &nbsp;·&nbsp; Books &nbsp;·&nbsp; Inbox &nbsp;·&nbsp; Campaigns &nbsp;·&nbsp; Service Desk</p>
        <p style="margin:0 0 4px;font-size:12px;color:#5a6b7d;">
          <a href="https://xentral.ae" style="color:#0064d9;text-decoration:none;">Website</a> &nbsp;·&nbsp;
          <a href="https://xentral.ae/support" style="color:#0064d9;text-decoration:none;">Support</a> &nbsp;·&nbsp;
          <a href="https://xentral.ae/privacy" style="color:#0064d9;text-decoration:none;">Privacy</a> &nbsp;·&nbsp;
          <a href="https://xentral.ae/terms" style="color:#0064d9;text-decoration:none;">Terms</a>
        </p>
        <p style="margin:0;font-size:11.5px;color:#a6b0ba;">Xentral · Dubai, UAE · <a href="mailto:hello@xentral.ae" style="color:#8995a3;text-decoration:none;">hello@xentral.ae</a></p>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:11px;color:#a6b0ba;max-width:560px;">For your security, Xentral will never ask for your password by email. If you didn't expect this message you can safely ignore it.</p>
  </td></tr>
</table>
</body>
</html>`;
}

// ── 1. Double Opt-In Verification Email ─────────────────────────────────────
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Confirm your email address</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
      Hi ${opts.name}, welcome to Xentral! Please confirm your email address to activate your account.
      This is a required step — your account will not be active until you verify.
    </p>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#0064d9;border-radius:10px;">
          <a href="${opts.verifyUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
            ✓ &nbsp;Confirm My Email Address
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link into your browser:</p>
    <p style="margin:0 0 28px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:12px;color:#374151;word-break:break-all;">
      ${opts.verifyUrl}
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;"/>
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
      This link expires in <strong>24 hours</strong>. If you did not create a Xentral account, you can safely ignore this email.
    </p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    subject: "Please confirm your email — Xentral",
    html: wrap(body, "One click to activate your Xentral account"),
  });
}

// ── 2. Admin: New Registration Alert ────────────────────────────────────────
export async function sendNewRegistrationAlert(user: {
  name: string;
  email: string;
  companyName: string;
  language?: string;
}) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">New Account Pending Approval</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">A new company has registered and is awaiting your review.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;width:140px;">Name</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;font-weight:600;">${user.name}</td></tr>
      <tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Email</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${user.email}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Company</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #e2e8f0;">${user.companyName}</td></tr>
    </table>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0064d9;border-radius:8px;">
          <a href="https://app.xentral.ae/admin" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
            Review in Admin Panel →
          </a>
        </td>
      </tr>
    </table>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "hello@xentral.ae",
    subject: `🆕 New Registration: ${user.companyName}`,
    html: wrap(body),
  });
}

// ── 3. Admin: Demo Request ───────────────────────────────────────────────────
export async function sendDemoRequestAlert(demo: {
  name: string;
  email: string;
  phone?: string;
  company: string;
  country: string;
  language: string;
  useCase?: string;
}) {
  const rows = [
    ["Name", demo.name],
    ["Email", demo.email],
    ["Phone", demo.phone || "—"],
    ["Company", demo.company],
    ["Country", demo.country],
    ["Use Case", demo.useCase || "—"],
  ];

  const tableRows = rows.map(([label, value], i) =>
    `<tr ${i % 2 === 0 ? 'style="background:#f8fafc;"' : ""}>
      <td style="padding:10px 16px;color:#64748b;font-size:13px;width:140px;${i > 0 ? "border-top:1px solid #e2e8f0;" : ""}">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#0f172a;${i > 0 ? "border-top:1px solid #e2e8f0;" : ""}">${value}</td>
    </tr>`
  ).join("");

  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">New Demo Request</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Someone has requested a demo of Xentral.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      ${tableRows}
    </table>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "hello@xentral.ae",
    subject: `📅 Demo Request: ${demo.company} (${demo.country})`,
    html: wrap(body),
  });
}

// ── 5. Lead notification (legacy) ───────────────────────────────────────────
export async function sendLeadNotification(lead: {
  firstName: string; lastName: string; email?: string | null;
  phone?: string | null; company?: string | null; source: string;
  status: string; value?: number | null; companyName: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "hello@xentral.ae",
      subject: `🎯 New Lead: ${lead.firstName} ${lead.lastName} — ${lead.companyName}`,
      html: wrap(`
        <h2 style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0f172a;">New Lead Added</h2>
        <p style="margin:0 0 16px;color:#64748b;font-size:13px;">via Xentral CRM — ${lead.companyName}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          ${[["Name", `${lead.firstName} ${lead.lastName}`], lead.phone ? ["Phone", lead.phone] : null, lead.email ? ["Email", lead.email] : null, ["Source", lead.source], ["Status", lead.status], lead.value ? ["Value", `AED ${lead.value.toLocaleString()}`] : null].filter((row): row is string[] => row !== null).map(([l, v], i) =>
            `<tr ${i%2===0?'style="background:#f8fafc;"':""}>
              <td style="padding:10px 16px;color:#64748b;font-size:13px;width:120px;${i>0?"border-top:1px solid #e2e8f0;":""}">${l}</td>
              <td style="padding:10px 16px;font-size:13px;color:#0f172a;font-weight:600;${i>0?"border-top:1px solid #e2e8f0;":""}">${v}</td>
            </tr>`
          ).join("")}
        </table>
      `),
    });
  } catch (err) {
    console.error("Lead notification error:", err);
  }
}

// ── 6. Password Reset ────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Reset your password</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
      Hi ${opts.name}, we received a request to reset your Xentral password.
      Click the button below to choose a new password.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#0064d9;border-radius:10px;">
          <a href="${opts.resetUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
            🔑 &nbsp;Reset My Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link:</p>
    <p style="margin:0 0 28px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:12px;color:#374151;word-break:break-all;">
      ${opts.resetUrl}
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;"/>
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
      This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
    </p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    subject: "Reset your Xentral password",
    html: wrap(body, "Reset your Xentral password — link expires in 1 hour"),
  });
}

// ── 7. Support: New Ticket Alert (to admin) ──────────────────────────────────
export async function sendNewTicketAlert(opts: {
  ticketId: string;
  subject: string;
  message: string;
  companyName: string;
  userEmail: string;
  priority: string;
}) {
  const priorityColor = opts.priority === "URGENT" ? "#dc2626" : opts.priority === "HIGH" ? "#d97706" : "#0064d9";
  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">New Support Ticket</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A customer has opened a new support ticket.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;width:120px;">Company</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f172a;">${opts.companyName}</td></tr>
      <tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Email</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${opts.userEmail}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Subject</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;">${opts.subject}</td></tr>
      <tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Priority</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:${priorityColor};border-top:1px solid #e2e8f0;">${opts.priority}</td></tr>
    </table>
    <div style="background:#f8fafc;border-left:3px solid #0064d9;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${opts.message}</p>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/admin" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Reply in Admin Panel →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "hello@xentral.ae",
    subject: `🎫 [${opts.priority}] New Ticket: ${opts.subject} — ${opts.companyName}`,
    html: wrap(body),
  });
}

// ── 8. Support: Admin Reply (to user) ────────────────────────────────────────
export async function sendTicketReply(opts: {
  to: string;
  userName: string;
  ticketSubject: string;
  replyMessage: string;
  ticketUrl: string;
}) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">We've replied to your ticket</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Hi ${opts.userName}, the Xentral support team has responded to your support request.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:4px 0;margin-bottom:20px;">
      <p style="margin:0;padding:10px 16px;font-size:12px;color:#94a3b8;border-bottom:1px solid #e2e8f0;">YOUR TICKET: ${opts.ticketSubject}</p>
      <div style="padding:16px;border-left:3px solid #0064d9;margin:12px;border-radius:0 8px 8px 0;background:#ffffff;">
        <p style="margin:0;font-size:14px;color:#0f172a;line-height:1.7;">${opts.replyMessage}</p>
      </div>
      <p style="margin:0;padding:8px 16px 12px;font-size:12px;color:#94a3b8;">— Xentral Support Team</p>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="${opts.ticketUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View & Reply →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    replyTo: "hello@xentral.ae",
    subject: `Re: ${opts.ticketSubject} — Xentral Support`,
    html: wrap(body, `Xentral Support has replied to: ${opts.ticketSubject}`),
  });
}

// ── 9. Support: User Reply (to admin) ────────────────────────────────────────
export async function sendTicketUserReply(opts: {
  ticketSubject: string;
  message: string;
  companyName: string;
  userEmail: string;
  ticketUrl: string;
}) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">Customer Replied to Ticket</h1>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;"><strong>${opts.companyName}</strong> (${opts.userEmail}) replied to: <em>${opts.ticketSubject}</em></p>
    <div style="background:#f8fafc;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${opts.message}</p>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="${opts.ticketUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Reply in Admin Panel →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "hello@xentral.ae",
    subject: `↩️ Customer Reply: ${opts.ticketSubject} — ${opts.companyName}`,
    html: wrap(body),
  });
}

// ── 10. New Marketplace Lead — notify all active companies ───────────────────
export async function sendNewMarketplaceLeadAlert(opts: {
  to: string;
  companyName: string;
  lead: {
    specialty?: string | null;
    category?: string | null;
    originCountry?: string | null;
    quality?: string | null;
    yearsExperience?: number | null;
    price: number;
    leadId: string;
  };
}) {
  const qualityColor = opts.lead.quality === "HOT" ? "#dc2626" : opts.lead.quality === "WARM" ? "#d97706" : "#0064d9";
  const body = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:600;">⚡ New lead just listed on Xentral Exchange</p>
    </div>

    <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#0f172a;">${opts.lead.specialty || "New Lead"}</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">${opts.lead.category || ""}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      ${opts.lead.category ? `<tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;width:140px;">Category</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;font-weight:600;">${opts.lead.category}</td></tr>` : ""}
      ${opts.lead.originCountry ? `<tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Origin</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${opts.lead.originCountry}</td></tr>` : ""}
      ${opts.lead.yearsExperience ? `<tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Experience</td><td style="padding:10px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${opts.lead.yearsExperience} years</td></tr>` : ""}
      ${opts.lead.quality ? `<tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Quality</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:${qualityColor};border-top:1px solid #e2e8f0;">${opts.lead.quality}</td></tr>` : ""}
      <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Starting Price</td><td style="padding:12px 16px;font-size:16px;font-weight:800;color:#059669;border-top:1px solid #e2e8f0;">AED ${opts.lead.price.toLocaleString()}</td></tr>
    </table>

    <p style="margin:0 0 20px;color:#64748b;font-size:13px;">Be the first to purchase this lead — prices increase as more companies buy.</p>

    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard/marketplace" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
        View Lead in Marketplace →
      </a>
    </td></tr></table>

    <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">
      You are receiving this because you have an active Xentral account. 
      <a href="https://app.xentral.ae/dashboard/settings" style="color:#94a3b8;">Manage notifications</a>
    </p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    subject: `⚡ New Lead: ${opts.lead.specialty || "New"} (${opts.lead.quality || "STANDARD"}) — AED ${opts.lead.price.toLocaleString()}`,
    html: wrap(body, `New marketplace lead: ${opts.lead.specialty} · AED ${opts.lead.price.toLocaleString()}`),
  });
}

// ─── Credit Added by Admin ───────────────────────────────────────────────────
export async function sendCreditAddedEmail(opts: {
  to: string; name: string; companyName: string;
  amount: number; newBalance: number; note?: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Credits Added to Your Account</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, your Xentral account has been topped up.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Credits Added</p>
      <p style="margin:0;font-size:42px;font-weight:900;color:#15803d;">+AED ${opts.amount.toLocaleString()}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:150px;">Company</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;">${opts.companyName}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">New Balance</td><td style="padding:12px 16px;font-size:14px;font-weight:800;color:#059669;border-top:1px solid #e2e8f0;">AED ${opts.newBalance.toLocaleString()}</td></tr>
      ${opts.note ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Note</td><td style="padding:12px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${opts.note}</td></tr>` : ""}
    </table>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard/marketplace" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Browse Marketplace →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `💰 AED ${opts.amount.toLocaleString()} credits added to your Xentral account`,
    html: wrap(body, `Your account has been topped up with AED ${opts.amount.toLocaleString()}`),
  });
}

// ─── Company Approved ─────────────────────────────────────────────────────────
export async function sendCompanyApprovedEmail(opts: {
  to: string; name: string; companyName: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Your Account Has Been Approved! 🎉</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, great news — your Xentral account has been reviewed and approved.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;color:#15803d;font-size:15px;font-weight:600;">✓ ${opts.companyName} is now active</p>
      <p style="margin:6px 0 0;color:#166534;font-size:13px;">You now have full access to the Xentral platform including the marketplace, CRM, and all features.</p>
    </div>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Here's what you can do now:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
      <li>Browse verified leads in the <strong>Marketplace</strong></li>
      <li>Manage contacts and deals in your <strong>CRM</strong></li>
      <li>Top up credits to purchase leads</li>
    </ul>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Go to Dashboard →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `✅ Your Xentral account is approved — Welcome, ${opts.name}!`,
    html: wrap(body, `${opts.companyName} is now approved and active on Xentral`),
  });
}

// ─── Company Suspended ────────────────────────────────────────────────────────
export async function sendCompanySuspendedEmail(opts: {
  to: string; name: string; companyName: string; reason?: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Account Suspended</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, your Xentral account has been temporarily suspended.</p>
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;color:#dc2626;font-size:15px;font-weight:600;">⚠ ${opts.companyName} — Account Suspended</p>
      ${opts.reason ? `<p style="margin:6px 0 0;color:#991b1b;font-size:13px;"><strong>Reason:</strong> ${opts.reason}</p>` : ""}
    </div>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;">If you believe this is a mistake or would like to resolve this, please contact our support team.</p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#64748b;border-radius:8px;">
      <a href="mailto:hello@xentral.ae" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Contact Support</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `⚠️ Your Xentral account has been suspended`,
    html: wrap(body, `Account suspended — contact support to resolve`),
  });
}

// ─── Topup Request Approved/Rejected ─────────────────────────────────────────
export async function sendTopupStatusEmail(opts: {
  to: string; name: string; amount: number; status: "APPROVED" | "REJECTED"; note?: string;
}) {
  const approved = opts.status === "APPROVED";
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Credit Top-Up ${approved ? "Approved" : "Rejected"}</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, your credit top-up request of <strong>AED ${opts.amount.toLocaleString()}</strong> has been ${approved ? "approved" : "rejected"}.</p>
    <div style="background:${approved ? "#f0fdf4" : "#fef2f2"};border:1px solid ${approved ? "#86efac" : "#fca5a5"};border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;color:${approved ? "#15803d" : "#dc2626"};font-size:15px;font-weight:600;">${approved ? "✓ AED " + opts.amount.toLocaleString() + " added to your balance" : "✗ Request could not be processed"}</p>
      ${opts.note ? `<p style="margin:6px 0 0;color:${approved ? "#166534" : "#991b1b"};font-size:13px;">${opts.note}</p>` : ""}
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard/credits" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${approved ? "Browse Marketplace →" : "Request Again →"}</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `${approved ? "✅" : "❌"} Credit top-up of AED ${opts.amount.toLocaleString()} ${approved ? "approved" : "rejected"}`,
    html: wrap(body, `Your top-up request has been ${approved ? "approved" : "rejected"}`),
  });
}

// ─── Bid Placed Confirmation ──────────────────────────────────────────────────
export async function sendBidPlacedEmail(opts: {
  to: string; name: string; leadSpecialty: string;
  amount: number; leadId: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Bid Placed Successfully</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, your bid has been submitted and is now under review.</p>
    <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#1d4ed8;font-size:13px;font-weight:600;">YOUR BID</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#1d4ed8;">AED ${opts.amount.toLocaleString()}</p>
      <p style="margin:4px 0 0;color:#3b82f6;font-size:13px;">${opts.leadSpecialty}</p>
    </div>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;">You will be notified once the admin reviews and accepts or rejects your bid.</p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard/marketplace" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View Marketplace →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `🏷️ Bid of AED ${opts.amount.toLocaleString()} placed — ${opts.leadSpecialty}`,
    html: wrap(body, `Your bid of AED ${opts.amount.toLocaleString()} has been submitted`),
  });
}

// ─── Bid Accepted ─────────────────────────────────────────────────────────────
export async function sendBidAcceptedEmail(opts: {
  to: string; name: string; companyName: string;
  leadSpecialty: string; amount: number; purchaseId: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Your Bid Was Accepted! 🎉</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, congratulations — you won the bid!</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:600;">BID ACCEPTED</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#15803d;">AED ${opts.amount.toLocaleString()}</p>
      <p style="margin:4px 0 0;color:#16a34a;font-size:13px;">${opts.leadSpecialty} · ${opts.companyName}</p>
    </div>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;">The lead has been added to your contacts. The purchase amount has been deducted from your credits.</p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard/purchases" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View Purchase →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `✅ Bid accepted — ${opts.leadSpecialty} for AED ${opts.amount.toLocaleString()}`,
    html: wrap(body, `Your bid was accepted — ${opts.leadSpecialty}`),
  });
}

// ─── Outbid Notification ──────────────────────────────────────────────────────
export async function sendOutbidEmail(opts: {
  to: string; name: string; leadSpecialty: string;
  yourBid: number; newHighBid: number; leadId: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">You've Been Outbid</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, another company has placed a higher bid on a lead you're competing for.</p>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;color:#92400e;font-size:13px;font-weight:600;">⚡ ${opts.leadSpecialty}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#92400e;font-size:13px;padding-bottom:6px;">Your bid</td><td style="text-align:right;color:#92400e;font-size:13px;text-decoration:line-through;">AED ${opts.yourBid.toLocaleString()}</td></tr>
        <tr><td style="color:#15803d;font-size:14px;font-weight:700;">Current highest</td><td style="text-align:right;color:#15803d;font-size:14px;font-weight:700;">AED ${opts.newHighBid.toLocaleString()}</td></tr>
      </table>
    </div>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;">Act fast — place a higher bid to stay in the running.</p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#0064d9;border-radius:8px;">
      <a href="https://app.xentral.ae/dashboard/marketplace" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Update My Bid →</a>
    </td></tr></table>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `⚡ You've been outbid on ${opts.leadSpecialty} — bid now`,
    html: wrap(body, `Someone outbid you — current high bid is AED ${opts.newHighBid.toLocaleString()}`),
  });
}

// ─── Dispute Opened ───────────────────────────────────────────────────────────
export async function sendDisputeConfirmationEmail(opts: {
  to: string; name: string; leadSpecialty: string; reason: string; purchaseId: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Dispute Submitted</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${opts.name}, we have received your dispute and will review it within 2 business days.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:130px;">Lead</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;">${opts.leadSpecialty}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Reason</td><td style="padding:12px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${opts.reason}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Status</td><td style="padding:12px 16px;font-size:13px;font-weight:700;color:#d97706;border-top:1px solid #e2e8f0;">Under Review</td></tr>
    </table>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;">You will receive an email once a decision has been made.</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `📋 Dispute submitted — ${opts.leadSpecialty}`,
    html: wrap(body, `Your dispute is under review`),
  });
}

// ─── Team Invite ──────────────────────────────────────────────────────────────
export async function sendTeamInviteEmail(opts: {
  to: string; inviterName: string; companyName: string;
  role: string; inviteLink: string;
}) {
  const roleLabel = opts.role === "ADMIN" ? "Admin" : opts.role === "MANAGER" ? "Sales Manager" : opts.role === "SALES" ? "Sales" : "Member";
  const perms = opts.role === "ADMIN" ? ["CRM", "Exchange", "Books", "Inbox", "Service Desk", "Team & Permissions"]
    : opts.role === "MANAGER" ? ["CRM", "Exchange", "Books", "Inbox", "Campaigns"]
    : ["CRM", "Inbox", "Exchange (view)", "Quotes"];
  const permChips = perms.map((p) => `<span style="display:inline-block;background:#eef4fb;color:#0a5dc2;font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;margin:0 6px 6px 0;">${p}</span>`).join("");
  const body = `
    <h1 style="margin:0 0 6px;font-size:21px;font-weight:800;color:#20303f;letter-spacing:-0.3px;">You've been invited to ${opts.companyName}</h1>
    <p style="margin:0 0 26px;color:#5a6b7d;font-size:14px;"><strong style="color:#20303f;">${opts.inviterName}</strong> invited you to join their Xentral workspace.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e9eaec;border-radius:10px;margin-bottom:24px;">
      <tr><td style="padding:14px 18px;border-bottom:1px solid #f1f2f3;"><span style="color:#8995a3;font-size:12px;">Invited by</span><br/><span style="color:#20303f;font-size:14px;font-weight:600;">${opts.inviterName}</span></td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid #f1f2f3;"><span style="color:#8995a3;font-size:12px;">Company</span><br/><span style="color:#20303f;font-size:14px;font-weight:600;">${opts.companyName}</span></td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid #f1f2f3;"><span style="color:#8995a3;font-size:12px;">Your role</span><br/><span style="color:#20303f;font-size:14px;font-weight:600;">${roleLabel}</span></td></tr>
      <tr><td style="padding:14px 18px;"><span style="color:#8995a3;font-size:12px;">Access</span><br/><div style="margin-top:8px;">${permChips}</div></td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr><td style="background:#0064d9;border-radius:9px;">
      <a href="${opts.inviteLink}" style="display:inline-block;padding:13px 30px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Accept invitation &amp; set up account</a>
    </td></tr></table>
    <p style="margin:0;color:#9a5800;font-size:12.5px;">⏳ This invitation expires in 7 days.</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM, to: opts.to,
    subject: `You're invited to join ${opts.companyName} on Xentral`,
    html: wrap(body, `${opts.inviterName} invited you to join ${opts.companyName}`),
  });
}

/** One-time login code (OTP) email. */
export async function sendLoginOtp(to: string, code: string) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#20303f;">Your login code</h1>
    <p style="margin:0 0 18px;font-size:14px;color:#5a6b7d;">Use this one-time code to sign in to Xentral. It expires in 10 minutes.</p>
    <div style="text-align:center;margin:8px 0 18px;">
      <span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#0064d9;background:#eef4ff;border:1px solid #d6e4ff;border-radius:12px;padding:14px 22px;">${code}</span>
    </div>
    <p style="margin:0;font-size:12.5px;color:#8995a3;">If you didn't request this, you can safely ignore this email.</p>`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Your Xentral login code: ${code}`,
    html: wrap(body, `Your one-time login code is ${code}`),
  });
}

// ── Email OTP (two-factor sign-in code) ─────────────────────────────────────
export async function sendOtpEmail(opts: { to: string; name: string; code: string }) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Your sign-in code</h1>
    <p style="margin:0 0 22px;color:#64748b;font-size:15px;line-height:1.6;">Hi ${opts.name}, use this code to finish signing in to Xentral.</p>
    <div style="text-align:center;margin:0 0 22px;">
      <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:10px;color:#0064d9;background:#eef4ff;border:1px solid #d6e4ff;border-radius:12px;padding:16px 24px;">${opts.code}</span>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">This code expires in <strong>10 minutes</strong>. If you didn't try to sign in, you can ignore this email and your account stays secure.</p>
  `;
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: opts.to, subject: "Your Xentral sign-in code", html: wrap(body, "Your one-time sign-in code") });
}

/** Customer-portal magic-link invite (tenant white-labelled in copy). */
export async function sendPortalInvite(opts: { to: string; tenantName: string; url: string }) {
  const t = String(opts.tenantName).replace(/[<>&]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[m] as string));
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#16202c;">Your portal with ${t}</h1>
    <p style="margin:0 0 20px;color:#5a6b7d;font-size:14px;line-height:1.6;"><strong>${t}</strong> has given you secure access to your customer portal — view your offers, pay invoices and find your documents in one place.</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:22px;"><tr><td style="background:#0064d9;border-radius:10px;">
      <a href="${opts.url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Open my portal →</a>
    </td></tr></table>
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">This secure link signs you in — no password needed. It expires in <strong>7 days</strong>. If you didn't expect this, you can ignore this email.</p>`;
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: opts.to, subject: `${opts.tenantName} — access your customer portal`, html: wrap(body, `${opts.tenantName} invited you to your customer portal`) });
}
