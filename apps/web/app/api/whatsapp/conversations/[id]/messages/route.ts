import "server-only";
import "../../../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
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

/** Message thread for a conversation, tenant-checked. Empty on the dormant preview. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ messages: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select m.direction, m.body, m.type, m."isAi", m.timestamp, m."sent_by_name" as "sentBy"
         from "whatsapp_messages" m join "whatsapp_conversations" c on c.id = m."conversation_id"
        where m."conversation_id" = $1 and c."company_id" = $2
        order by m.timestamp asc limit 300`, [params.id, session.companyId]);
    return NextResponse.json({ messages: rows });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
