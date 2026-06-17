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
    firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" },
    title: { type: "string", description: "Job title / role" }, company: { type: "string", description: "Company/account name the contact belongs to" }, notes: { type: "string" },
  }, required: ["firstName"] } } },
  { type: "function", function: { name: "create_company", description: "Create a new company / account / organisation in the CRM.", parameters: { type: "object", properties: {
    name: { type: "string" }, industry: { type: "string" }, website: { type: "string" }, phone: { type: "string" }, email: { type: "string" }, city: { type: "string" }, country: { type: "string" },
  }, required: ["name"] } } },
  { type: "function", function: { name: "create_lead", description: "Create a new sales lead/opportunity.", parameters: { type: "object", properties: {
    firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company: { type: "string" }, value: { type: "number", description: "Deal value in AED" }, notes: { type: "string" },
  }, required: ["firstName", "lastName"] } } },
];

type ExecResult = { ok: boolean; summary: string; action?: { type: string; label: string; href?: string } };

async function exec(url: string, companyId: string, userId: string, name: string, a: Record<string, unknown>): Promise<ExecResult> {
  const p = pool(url);
  const s = (v: unknown) => (v == null ? null : String(v));
  try {
    if (name === "create_contact") {
      const id = newId("ct");
      await p.query(`insert into "contacts" (id,"firstName","lastName",email,phone,title,notes,"companyId","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [id, s(a.firstName) || "Contact", s(a.lastName), s(a.email), s(a.phone), s(a.title), s(a.notes ? `${a.notes}${a.company ? ` · ${a.company}` : ""}` : a.company ? `Company: ${a.company}` : null), companyId]);
      const nm = [a.firstName, a.lastName].filter(Boolean).join(" ");
      return { ok: true, summary: `Created contact ${nm} (id ${id})`, action: { type: "create_contact", label: `Contact created: ${nm}`, href: `/contacts/${id}` } };
    }
    if (name === "create_company") {
      const id = newId("ac");
      await p.query(`insert into "accounts" (id,name,industry,website,phone,email,city,country,"companyId","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [id, s(a.name) || "Company", s(a.industry), s(a.website), s(a.phone), s(a.email), s(a.city), s(a.country), companyId]);
      return { ok: true, summary: `Created company ${a.name} (id ${id})`, action: { type: "create_company", label: `Company created: ${a.name}`, href: `/companies/${id}` } };
    }
    if (name === "create_lead") {
      const id = newId("ld");
      await p.query(`insert into "leads" (id,"firstName","lastName",email,phone,company,value,notes,"companyId","createdById","createdAt","updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now())`,
        [id, s(a.firstName) || "Lead", s(a.lastName) || "", s(a.email), s(a.phone), s(a.company), a.value != null ? Number(a.value) : null, s(a.notes), companyId, userId]);
      const nm = [a.firstName, a.lastName].filter(Boolean).join(" ");
      return { ok: true, summary: `Created lead ${nm} (id ${id})`, action: { type: "create_lead", label: `Lead created: ${nm}`, href: `/leads/${id}` } };
    }
    return { ok: false, summary: `Unknown tool ${name}` };
  } catch (e) {
    return { ok: false, summary: `Could not ${name}: ${(e as Error).message}` };
  }
}

const SYSTEM = `You are Xentral AI, the built-in agent inside Xentral — a UAE-first business OS (CRM, invoicing, inventory, payments via Telr). Currency AED, 5% VAT.
You can take REAL actions with tools: create_contact, create_company, create_lead. When the user asks to add / create / log / "lege an" / "erstelle" a contact, company or lead, CALL the matching tool with the details they gave, then confirm in ONE short sentence what you created. The user may write German or English. For pure questions (no creation), just answer concisely. Never claim you created something unless a tool actually ran.`;

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

  const openai = new OpenAI({ apiKey: cfg.key });
  const baseMsgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: prompt },
  ];
  const actions: { type: string; label: string; href?: string }[] = [];
  try {
    const first = await openai.chat.completions.create({ model: cfg.model, temperature: 0.3, max_tokens: 700, messages: baseMsgs, tools: TOOLS, tool_choice: "auto" });
    const msg = first.choices[0]?.message;
    if (msg?.tool_calls?.length) {
      const toolMsgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch { /* ignore */ }
        const r = await exec(url, session.companyId, session.userId, tc.function.name, args);
        if (r.action) actions.push(r.action);
        toolMsgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(r) });
      }
      const second = await openai.chat.completions.create({ model: cfg.model, temperature: 0.3, max_tokens: 400, messages: [...baseMsgs, msg, ...toolMsgs] });
      return NextResponse.json({ answer: second.choices[0]?.message?.content?.trim() || "Done.", actions });
    }
    return NextResponse.json({ answer: msg?.content?.trim() || "Sorry, I couldn't respond.", actions });
  } catch {
    return NextResponse.json({ answer: "I had trouble just now — please try again.", actions });
  }
}
