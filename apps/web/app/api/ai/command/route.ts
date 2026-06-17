import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import OpenAI from "openai";
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
const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

async function resolveKey(url: string, companyId: string): Promise<{ key: string; model: string } | null> {
  const envKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-") ? process.env.OPENAI_API_KEY : "";
  try {
    const { rows } = await pool(url).query(
      `select "apiKey", "defaultModel" from "ai_providers" where "companyId" = $1 and provider = 'openai' and "isActive" = true and "apiKey" is not null order by "updatedAt" desc limit 1`, [companyId]);
    const dbKey = rows[0]?.apiKey && String(rows[0].apiKey).startsWith("sk-") ? String(rows[0].apiKey) : "";
    const key = dbKey || envKey;
    if (!key) return null;
    return { key, model: rows[0]?.defaultModel || "gpt-4o-mini" };
  } catch { return envKey ? { key: envKey, model: "gpt-4o-mini" } : null; }
}

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  { type: "function", function: { name: "create_contact", description: "Create a new CRM contact (a person).", parameters: { type: "object", properties: {
    firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, title: { type: "string" }, company: { type: "string" }, notes: { type: "string" } }, required: ["firstName"] } } },
  { type: "function", function: { name: "create_company", description: "Create a new company / account / organisation.", parameters: { type: "object", properties: {
    name: { type: "string" }, industry: { type: "string" }, website: { type: "string" }, phone: { type: "string" }, email: { type: "string" }, city: { type: "string" }, country: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_lead", description: "Create a new sales lead/opportunity.", parameters: { type: "object", properties: {
    firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company: { type: "string" }, value: { type: "number" }, notes: { type: "string" } }, required: ["firstName", "lastName"] } } },
  { type: "function", function: { name: "create_task", description: "Create a to-do / task for the current user.", parameters: { type: "object", properties: {
    title: { type: "string" }, description: { type: "string" }, dueAt: { type: "string", description: "Local date-time YYYY-MM-DDThh:mm (no timezone)" } }, required: ["title"] } } },
  { type: "function", function: { name: "create_meeting", description: "Schedule a meeting / call / appointment in the calendar.", parameters: { type: "object", properties: {
    title: { type: "string" }, whenISO: { type: "string", description: "Local start date-time YYYY-MM-DDThh:mm (no timezone/Z)" }, durationMins: { type: "number" }, type: { type: "string", enum: ["meeting", "call", "appointment"] }, location: { type: "string" } }, required: ["title", "whenISO"] } } },
  { type: "function", function: { name: "find_contact", description: "Search existing contacts by name or email. Call this first to get a contactId before add_note or update_contact.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "add_note", description: "Append a note to an existing contact (needs contactId from find_contact).", parameters: { type: "object", properties: { contactId: { type: "string" }, note: { type: "string" } }, required: ["contactId", "note"] } } },
  { type: "function", function: { name: "update_contact", description: "Update fields on an existing contact (needs contactId from find_contact).", parameters: { type: "object", properties: { contactId: { type: "string" }, title: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, notes: { type: "string" } }, required: ["contactId"] } } },
  { type: "function", function: { name: "create_invoice", description: "Create a draft invoice for a customer with line items. Number, VAT and totals are computed automatically.", parameters: { type: "object", properties: {
    customer: { type: "string", description: "Customer / company name" }, dueInDays: { type: "number", description: "Days until due (default 14)" }, notes: { type: "string" },
    lines: { type: "array", items: { type: "object", properties: { name: { type: "string" }, qty: { type: "number" }, unitPrice: { type: "number" }, vatRate: { type: "number", description: "default 5" }, discountPct: { type: "number" } }, required: ["name", "unitPrice"] } } }, required: ["customer", "lines"] } } },
  { type: "function", function: { name: "create_quote", description: "Create a draft quote/offer for a customer with line items. Number, VAT and totals are computed automatically.", parameters: { type: "object", properties: {
    customer: { type: "string" }, validInDays: { type: "number", description: "Days the quote stays valid (default 30)" }, notes: { type: "string" },
    lines: { type: "array", items: { type: "object", properties: { name: { type: "string" }, qty: { type: "number" }, unitPrice: { type: "number" }, vatRate: { type: "number", description: "default 5" }, discountPct: { type: "number" } }, required: ["name", "unitPrice"] } } }, required: ["customer", "lines"] } } },
];

async function nextNumber(p: Pool, companyId: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-%`;
  const { rows } = await p.query(`select number from "${prefix === "INV" ? "invoices" : "quotes"}" where "companyId"=$1 and number like $2 order by number desc limit 1`, [companyId, like]);
  let n = 1;
  if (rows[0]?.number) { const m = String(rows[0].number).match(/(\d+)$/); if (m) n = Number(m[1]) + 1; }
  return `${prefix}-${year}-${String(n).padStart(5, "0")}`;
}
async function findOrCreateCustomer(p: Pool, companyId: string, name: string): Promise<string> {
  const found = await p.query(`select id from "billing_customers" where "companyId"=$1 and lower(name)=lower($2) limit 1`, [companyId, name]);
  if (found.rows[0]) return found.rows[0].id;
  const id = "bc" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  await p.query(`insert into "billing_customers" (id,"companyId",name,"createdAt","updatedAt") values ($1,$2,$3,now(),now())`, [id, companyId, name || "Customer"]);
  return id;
}
type LineIn = { name?: unknown; qty?: unknown; unitPrice?: unknown; vatRate?: unknown; discountPct?: unknown };
function computeLines(raw: LineIn[]) {
  let subtotal = 0, vatTotal = 0;
  const norm = (raw || []).filter((l) => String(l.name ?? "").trim() || Number(l.unitPrice) > 0).map((l, idx) => {
    const qty = Number(l.qty) || 1, up = Number(l.unitPrice) || 0, disc = Number(l.discountPct) || 0;
    const vat = l.vatRate == null ? 5 : Number(l.vatRate);
    const net = qty * up * (1 - disc / 100); subtotal += net; vatTotal += net * vat / 100;
    return { pos: idx, name: String(l.name ?? "Item") || "Item", qty, up, vat, disc, net };
  });
  return { norm, subtotal, vatTotal, total: subtotal + vatTotal };
}

type Action = { type: string; label: string; href?: string };
type ExecResult = { ok: boolean; summary: string; data?: unknown; action?: Action };

async function exec(url: string, companyId: string, userId: string, name: string, a: Record<string, unknown>): Promise<ExecResult> {
  const p = pool(url);
  const s = (v: unknown) => (v == null ? null : String(v));
  try {
    if (name === "create_contact") {
      const id = newId("ct");
      await p.query(`insert into "contacts" (id,"firstName","lastName",email,phone,title,notes,"companyId","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [id, s(a.firstName) || "Contact", s(a.lastName), s(a.email), s(a.phone), s(a.title), s(a.notes ? `${a.notes}${a.company ? ` · ${a.company}` : ""}` : a.company ? `Company: ${a.company}` : null), companyId]);
      const nm = [a.firstName, a.lastName].filter(Boolean).join(" ");
      return { ok: true, summary: `Created contact ${nm}`, action: { type: "create_contact", label: `Contact created: ${nm}`, href: `/contacts/${id}` } };
    }
    if (name === "create_company") {
      const id = newId("ac");
      await p.query(`insert into "accounts" (id,name,industry,website,phone,email,city,country,"companyId","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [id, s(a.name) || "Company", s(a.industry), s(a.website), s(a.phone), s(a.email), s(a.city), s(a.country), companyId]);
      return { ok: true, summary: `Created company ${a.name}`, action: { type: "create_company", label: `Company created: ${a.name}`, href: `/companies/${id}` } };
    }
    if (name === "create_lead") {
      const id = newId("ld");
      await p.query(`insert into "leads" (id,"firstName","lastName",email,phone,company,value,notes,"companyId","createdById","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now())`,
        [id, s(a.firstName) || "Lead", s(a.lastName) || "", s(a.email), s(a.phone), s(a.company), a.value != null ? Number(a.value) : null, s(a.notes), companyId, userId]);
      const nm = [a.firstName, a.lastName].filter(Boolean).join(" ");
      return { ok: true, summary: `Created lead ${nm}`, action: { type: "create_lead", label: `Lead created: ${nm}`, href: `/leads/${id}` } };
    }
    if (name === "create_task") {
      const id = newId("tk");
      await p.query(`insert into "tasks" (id,title,description,"dueAt","isCompleted","companyId","assignedToId","createdAt","updatedAt") values ($1,$2,$3,${a.dueAt ? "$4::timestamp" : "null"},false,${a.dueAt ? "$5" : "$4"},${a.dueAt ? "$6" : "$5"},now(),now())`,
        a.dueAt ? [id, s(a.title) || "Task", s(a.description), s(a.dueAt), companyId, userId] : [id, s(a.title) || "Task", s(a.description), companyId, userId]);
      return { ok: true, summary: `Created task "${a.title}"`, action: { type: "create_task", label: `Task created: ${a.title}`, href: `/work-queue` } };
    }
    if (name === "create_meeting") {
      const id = newId("mt");
      const dur = Number(a.durationMins) > 0 ? Number(a.durationMins) : 30;
      await p.query(`insert into "calendar_meetings" (id,"companyId","organizerId",title,type,location,"startsAt","endsAt","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7::timestamp,($7::timestamp + ($8 || ' minutes')::interval),now(),now())`,
        [id, companyId, userId, s(a.title) || "Meeting", s(a.type) || "meeting", s(a.location), s(a.whenISO), String(dur)]);
      return { ok: true, summary: `Scheduled "${a.title}" at ${a.whenISO}`, action: { type: "create_meeting", label: `Meeting scheduled: ${a.title}`, href: `/calendar` } };
    }
    if (name === "find_contact") {
      const q = `%${String(a.query || "").toLowerCase()}%`;
      const { rows } = await p.query(`select id, "firstName", "lastName", email, title from "contacts" where "companyId"=$1 and (lower(coalesce("firstName",'')||' '||coalesce("lastName",'')) like $2 or lower(coalesce(email,'')) like $2) order by "updatedAt" desc limit 5`, [companyId, q]);
      return { ok: true, summary: `Found ${rows.length} contact(s)`, data: rows };
    }
    if (name === "add_note") {
      const r = await p.query(`update "contacts" set notes = coalesce(notes || E'\\n', '') || $1, "updatedAt"=now() where id=$2 and "companyId"=$3`, [s(a.note) || "", s(a.contactId), companyId]);
      if (!r.rowCount) return { ok: false, summary: "Contact not found" };
      return { ok: true, summary: "Note added", action: { type: "add_note", label: "Note added", href: `/contacts/${s(a.contactId)}` } };
    }
    if (name === "update_contact") {
      const sets: string[] = []; const vals: unknown[] = []; let i = 1;
      for (const f of ["title", "email", "phone", "notes"]) if (f in a) { sets.push(`"${f}"=$${i}`); vals.push(s(a[f])); i++; }
      if (!sets.length) return { ok: false, summary: "No fields to update" };
      sets.push(`"updatedAt"=now()`); vals.push(s(a.contactId), companyId);
      const r = await p.query(`update "contacts" set ${sets.join(", ")} where id=$${i} and "companyId"=$${i + 1}`, vals);
      if (!r.rowCount) return { ok: false, summary: "Contact not found" };
      return { ok: true, summary: "Contact updated", action: { type: "update_contact", label: "Contact updated", href: `/contacts/${s(a.contactId)}` } };
    }
    if (name === "create_invoice" || name === "create_quote") {
      const isInv = name === "create_invoice";
      const custId = await findOrCreateCustomer(p, companyId, String(a.customer || "Customer"));
      const { norm, subtotal, vatTotal, total } = computeLines((a.lines as LineIn[]) || []);
      if (norm.length === 0) return { ok: false, summary: "No valid line items" };
      const number = await nextNumber(p, companyId, isInv ? "INV" : "QUO");
      const id = newId(isInv ? "iv" : "qt");
      if (isInv) {
        const due = Number(a.dueInDays) > 0 ? Number(a.dueInDays) : 14;
        await p.query(`insert into "invoices" (id,"companyId","customerId","createdById",number,status,"issueDate","dueDate",currency,subtotal,"discountTotal","vatTotal",total,"amountPaid",notes,"publicToken","createdAt","updatedAt") values ($1,$2,$3,$4,$5,'DRAFT'::"InvoiceStatus",now(),(now()+($6||' days')::interval),'AED',$7,0,$8,$9,0,$10,$11,now(),now())`,
          [id, companyId, custId, userId, number, String(due), subtotal.toFixed(2), vatTotal.toFixed(2), total.toFixed(2), s(a.notes), newId("tok")]);
        for (const l of norm) await p.query(`insert into "invoice_lines" (id,"invoiceId",position,name,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [newId("il"), id, l.pos, l.name, l.qty, l.up, l.vat, l.disc, l.net.toFixed(2)]);
        return { ok: true, summary: `Created invoice ${number} (AED ${total.toFixed(2)})`, action: { type: "create_invoice", label: `Invoice ${number} drafted — AED ${total.toFixed(2)}`, href: `/invoices/${id}` } };
      } else {
        const valid = Number(a.validInDays) > 0 ? Number(a.validInDays) : 30;
        await p.query(`insert into "quotes" (id,"companyId","customerId","createdById",number,status,"issueDate","validUntil",currency,subtotal,"discountTotal","vatTotal",total,notes,"publicToken","createdAt","updatedAt") values ($1,$2,$3,$4,$5,'DRAFT'::"QuoteStatus",now(),(now()+($6||' days')::interval),'AED',$7,0,$8,$9,$10,$11,now(),now())`,
          [id, companyId, custId, userId, number, String(valid), subtotal.toFixed(2), vatTotal.toFixed(2), total.toFixed(2), s(a.notes), newId("tok")]);
        for (const l of norm) await p.query(`insert into "quote_lines" (id,"quoteId",position,name,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [newId("ql"), id, l.pos, l.name, l.qty, l.up, l.vat, l.disc, l.net.toFixed(2)]);
        return { ok: true, summary: `Created quote ${number} (AED ${total.toFixed(2)})`, action: { type: "create_quote", label: `Quote ${number} drafted — AED ${total.toFixed(2)}`, href: `/quotations/${id}` } };
      }
    }
    return { ok: false, summary: `Unknown tool ${name}` };
  } catch (e) {
    return { ok: false, summary: `Could not ${name}: ${(e as Error).message}` };
  }
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ answer: "AI actions are available once the workspace is live.", actions: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { prompt?: string; history?: { role: string; content: string }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  const history = Array.isArray(body.history) ? body.history.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-8) : [];

  const cfg = await resolveKey(url, session.companyId);
  if (!cfg) return NextResponse.json({ answer: "Xentral AI isn't configured yet — add an OpenAI key in Settings → AI Hub.", actions: [] });

  // workspace timezone + local now (so "tomorrow 3pm" resolves correctly)
  let tz = "Asia/Dubai";
  try { const c = await pool(url).query(`select timezone from "companies" where id=$1`, [session.companyId]); if (c.rows[0]?.timezone) tz = c.rows[0].timezone; } catch { /* default */ }
  const localNow = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()).replace(", ", "T");

  const SYSTEM = `You are Xentral AI, the built-in agent inside Xentral — a UAE-first business OS (CRM, invoicing, inventory, payments via Telr). Currency AED, 5% VAT.
You take REAL actions with tools: create_contact, create_company, create_lead, create_task, create_meeting, find_contact, add_note, update_contact.
When the user asks to add/create/log/schedule/note/update something ("lege an", "erstelle", "plane", "notiere", "aktualisiere"), CALL the matching tool, then confirm in ONE short sentence what you did. The user may write German or English.
To add a note to or update an EXISTING contact, FIRST call find_contact to get its id, then call add_note / update_contact with that id. Never claim you found or changed a record without calling the tool.
The workspace timezone is ${tz}; the current local date-time is ${localNow}. For create_task.dueAt and create_meeting.whenISO output LOCAL wall-clock "YYYY-MM-DDThh:mm" with NO timezone/Z (e.g. "morgen 15 Uhr" → tomorrow's date + "T15:00").
For pure questions (no action), just answer concisely.`;

  const openai = new OpenAI({ apiKey: cfg.key });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: prompt },
  ];
  const actions: Action[] = [];
  try {
    for (let round = 0; round < 4; round++) {
      const last = round === 3;
      const r = await openai.chat.completions.create({ model: cfg.model, temperature: 0.3, max_tokens: 600, messages, tools: TOOLS, tool_choice: last ? "none" : "auto" });
      const msg = r.choices[0]?.message;
      if (!msg) break;
      messages.push(msg);
      if (!msg.tool_calls?.length) return NextResponse.json({ answer: msg.content?.trim() || "Done.", actions });
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch { /* ignore */ }
        const res = await exec(url, session.companyId, session.userId, tc.function.name, args);
        if (res.action) actions.push(res.action);
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(res) });
      }
    }
    return NextResponse.json({ answer: actions.length ? "Done." : "I couldn't complete that — please rephrase.", actions });
  } catch {
    return NextResponse.json({ answer: "I had trouble just now — please try again.", actions });
  }
}
