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

async function guard() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return { err: NextResponse.json({ error: "Live data not enabled" }, { status: 503 }) };
  const session = await resolveSession();
  if (!session) return { err: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { url, session };
}

/** Update a meeting (tenant-scoped). Accepts any subset of editable fields. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ("err" in g) return g.err;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const put = (col: string, val: unknown, cast = "") => { sets.push(`"${col}" = $${i}${cast}`); vals.push(val); i++; };
  if (typeof body.title === "string") put("title", body.title.trim());
  if ("description" in body) put("description", String(body.description ?? "") || null);
  if (typeof body.startsAt === "string") put("startsAt", body.startsAt, "::timestamptz");
  if (typeof body.endsAt === "string") put("endsAt", body.endsAt, "::timestamptz");
  if ("allDay" in body) put("allDay", Boolean(body.allDay));
  if ("location" in body) put("location", String(body.location ?? "") || null);
  if ("meetingUrl" in body) put("meetingUrl", String(body.meetingUrl ?? "") || null);
  if (typeof body.type === "string") put("type", body.type);
  if (typeof body.status === "string") put("status", body.status);
  if (sets.length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  put("updatedAt", new Date().toISOString(), "::timestamptz");

  vals.push(params.id, g.session.companyId);
  try {
    const { rows } = await pool(g.url).query(
      `update "calendar_meetings" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}
       returning id, title, description, "startsAt", "endsAt", "allDay", location, "meetingUrl", type, status, "organizerId"`,
      vals
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ meeting: rows[0] });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** Delete a meeting (tenant-scoped). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if ("err" in g) return g.err;
  try {
    const { rowCount } = await pool(g.url).query(
      `delete from "calendar_meetings" where id = $1 and "companyId" = $2`, [params.id, g.session.companyId]);
    return NextResponse.json({ ok: rowCount ? true : false });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
