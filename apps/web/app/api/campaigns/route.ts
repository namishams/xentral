import "server-only";
import "../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
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

/** Email campaigns for the signed-in workspace, with live lead + open/reply stats. Empty on dormant preview. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ campaigns: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select c.id, c.name, c.status, c."createdAt",
              (select count(*) from "campaign_leads" cl where cl."campaignId" = c.id)::int as audience,
              (select count(*) from "campaign_email_logs" l where l."campaignId" = c.id)::int as sent,
              (select count(*) from "campaign_email_logs" l where l."campaignId" = c.id and l."openedAt" is not null)::int as opens,
              (select count(*) from "campaign_email_logs" l where l."campaignId" = c.id and l."repliedAt" is not null)::int as replies
         from "email_campaigns" c where c."companyId" = $1 order by c."createdAt" desc limit 200`, [session.companyId]);
    return NextResponse.json({ campaigns: rows });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}
