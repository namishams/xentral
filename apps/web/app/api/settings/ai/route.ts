import "server-only";
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
const armed = () => process.env.XENTRAL_LIVE_DATA === "1" && !!process.env.DATABASE_URL;
const s = (v: unknown) => typeof v === "string" ? v : null;

/** Read the workspace's WhatsApp AI agent config (key masked). */
export async function GET() {
  if (!armed()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(process.env.DATABASE_URL!).query(
      `select "agent_name" as "agentName", "agent_tone" as "agentTone", "agent_business_type" as "agentBusinessType",
              "agent_knowledge" as "agentKnowledge", "agent_custom_prompt" as "agentCustomPrompt",
              "agent_playbook" as "agentPlaybook", "agent_signoff" as "agentSignoff", "openaiKey"
         from "companies" where id = $1 limit 1`, [session.companyId]);
    const c = rows[0] || {};
    return NextResponse.json({
      agentName: c.agentName ?? "", agentTone: c.agentTone ?? "", agentBusinessType: c.agentBusinessType ?? "",
      agentKnowledge: c.agentKnowledge ?? "", agentCustomPrompt: c.agentCustomPrompt ?? "",
      agentPlaybook: c.agentPlaybook ?? "", agentSignoff: c.agentSignoff ?? "",
      openaiKeySet: !!c.openaiKey,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Update the agent config (tenant-scoped). Only non-empty openaiKey overwrites the key. */
export async function PUT(req: Request) {
  if (!armed()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  try {
    const db = pool(process.env.DATABASE_URL!);
    await db.query(
      `update "companies" set
         "agent_name" = coalesce($2, "agent_name"),
         "agent_tone" = coalesce($3, "agent_tone"),
         "agent_business_type" = coalesce($4, "agent_business_type"),
         "agent_knowledge" = coalesce($5, "agent_knowledge"),
         "agent_custom_prompt" = coalesce($6, "agent_custom_prompt"),
         "agent_playbook" = coalesce($7, "agent_playbook"),
         "agent_signoff" = coalesce($8, "agent_signoff"),
         "updatedAt" = now()
       where id = $1`,
      [session.companyId, s(b.agentName), s(b.agentTone), s(b.agentBusinessType), s(b.agentKnowledge), s(b.agentCustomPrompt), s(b.agentPlaybook), s(b.agentSignoff)]);
    const key = s(b.openaiKey);
    if (key && key.trim() && !key.includes("•")) {
      await db.query(`update "companies" set "openaiKey" = $2 where id = $1`, [session.companyId, key.trim()]);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
