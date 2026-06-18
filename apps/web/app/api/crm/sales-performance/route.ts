import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
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
const N = (v: unknown) => Number(v ?? 0);
const OPEN = "('NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION')";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ reps: [], teams: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  try {
    const teams = (await p.query(`select id, name from "sales_teams" where "companyId"=$1 order by name asc`, [cid])).rows;
    const reps = (await p.query(
      `select u.id, u.name, u.email, u."salesTeamId" as "teamId", u."salesRole" as "salesRole", st.name as "teamName",
              coalesce(sum(case when l.status::text in ${OPEN} then l.value else 0 end),0) as pipeline,
              coalesce(sum(case when l.status::text = 'WON' then l.value else 0 end),0) as won,
              count(case when l.status::text = 'WON' then 1 end)::int as "wonCount",
              count(case when l.status::text = 'LOST' then 1 end)::int as "lostCount",
              count(case when l.status::text in ${OPEN} then 1 end)::int as "openCount"
         from "users" u
         left join "leads" l on l."assignedToId" = u.id and l."companyId" = u."companyId"
         left join "sales_teams" st on st.id = u."salesTeamId"
        where u."companyId" = $1 and u."isActive" = true
        group by u.id, u.name, u.email, u."salesTeamId", u."salesRole", st.name
        order by won desc, pipeline desc`, [cid])).rows
      .map((r) => ({ ...r, pipeline: N(r.pipeline), won: N(r.won) }));
    return NextResponse.json({ teams, reps });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}
