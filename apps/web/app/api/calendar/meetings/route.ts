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

/** Calendar meetings for the signed-in workspace (next 60 days). Empty on the dormant preview. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ meetings: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, title, description, "startsAt", "endsAt", "allDay", location, "meetingUrl", type, status
         from "calendar_meetings"
        where "companyId" = $1 and "endsAt" >= now() - interval '1 day' and "startsAt" <= now() + interval '60 days'
        order by "startsAt" asc limit 300`, [session.companyId]);
    return NextResponse.json({ meetings: rows });
  } catch {
    return NextResponse.json({ meetings: [] });
  }
}
