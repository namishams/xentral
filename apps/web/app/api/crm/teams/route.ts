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
const newId = (pf: string) => pf + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ teams: [], users: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  try {
    const teams = (await p.query(
      `select t.id, t.name, t."managerId" as "managerId", m.name as "managerName",
              (select count(*) from "users" u where u."salesTeamId" = t.id)::int as "memberCount"
         from "sales_teams" t left join "users" m on m.id = t."managerId"
        where t."companyId" = $1 order by t.name asc`, [cid])).rows;
    const users = (await p.query(
      `select id, name, email, "salesTeamId" as "teamId", "salesRole" as "salesRole", "managerId" as "managerId"
         from "users" where "companyId" = $1 and "isActive" = true order by name asc`, [cid])).rows;
    return NextResponse.json({ teams, users });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Team name required" }, { status: 400 });
  try {
    const id = newId("st");
    await p.query(`insert into "sales_teams" (id,"companyId",name,"managerId","createdAt","updatedAt") values ($1,$2,$3,$4,now(),now())`,
      [id, cid, name, b.managerId ? String(b.managerId) : null]);
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  try {
    // Assign / move a member, set their sales role and manager
    if (typeof b.userId === "string" && b.userId) {
      const own = await p.query(`select id from "users" where id=$1 and "companyId"=$2 limit 1`, [b.userId, cid]);
      if (!own.rows[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const sets: string[] = []; const vals: unknown[] = []; let i = 1;
      if ("teamId" in b) { sets.push(`"salesTeamId"=$${i}`); vals.push(b.teamId ? String(b.teamId) : null); i++; }
      if ("managerId" in b) { sets.push(`"managerId"=$${i}`); vals.push(b.managerId ? String(b.managerId) : null); i++; }
      if (typeof b.salesRole === "string" && ["REP", "SENIOR", "LEAD", "MANAGER"].includes(b.salesRole)) { sets.push(`"salesRole"=$${i}`); vals.push(b.salesRole); i++; }
      if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
      vals.push(b.userId, cid);
      await p.query(`update "users" set ${sets.join(", ")} where id=$${i} and "companyId"=$${i + 1}`, vals);
      return NextResponse.json({ ok: true });
    }
    // Update a team (rename / set manager)
    if (typeof b.teamId === "string" && b.teamId) {
      const own = await p.query(`select id from "sales_teams" where id=$1 and "companyId"=$2 limit 1`, [b.teamId, cid]);
      if (!own.rows[0]) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      const sets: string[] = []; const vals: unknown[] = []; let i = 1;
      if (typeof b.name === "string" && b.name.trim()) { sets.push(`name=$${i}`); vals.push(b.name.trim()); i++; }
      if ("managerId" in b) { sets.push(`"managerId"=$${i}`); vals.push(b.managerId ? String(b.managerId) : null); i++; }
      if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
      sets.push(`"updatedAt"=now()`); vals.push(b.teamId, cid);
      await p.query(`update "sales_teams" set ${sets.join(", ")} where id=$${i} and "companyId"=$${i + 1}`, vals);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "userId or teamId required" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  const id = new URL(req.url).searchParams.get("teamId");
  if (!id) return NextResponse.json({ error: "teamId required" }, { status: 400 });
  try {
    await p.query(`update "users" set "salesTeamId"=null where "salesTeamId"=$1 and "companyId"=$2`, [id, cid]);
    await p.query(`delete from "sales_teams" where id=$1 and "companyId"=$2`, [id, cid]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Delete failed" }, { status: 500 }); }
}
