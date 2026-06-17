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

/** WhatsApp conversations for the signed-in workspace. Empty on the dormant preview. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ conversations: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, "contact_name" as name, "contact_phone" as phone, "last_message_body" as preview,
              "last_message_at" as at, "unread_count" as unread, status, "agent_mode" as mode
         from "whatsapp_conversations" where "company_id" = $1
        order by "last_message_at" desc nulls last limit 100`, [session.companyId]);
    return NextResponse.json({ conversations: rows });
  } catch {
    return NextResponse.json({ conversations: [] });
  }
}
