import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
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
const newId = () => "cm" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);

/** Calendar meetings for the signed-in workspace (windowed). Empty on the dormant preview. */
export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ meetings: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Optional from/to window (ISO) — defaults to a wide 90-day band around now.
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from"); const to = sp.get("to");
  try {
    const { rows } = await pool(url).query(
      `select id, title, description, "startsAt", "endsAt", "allDay", location, "meetingUrl", type, status, "organizerId"
         from "calendar_meetings"
        where "companyId" = $1
          and "endsAt"   >= coalesce($2::timestamptz, now() - interval '40 days')
          and "startsAt" <= coalesce($3::timestamptz, now() + interval '60 days')
        order by "startsAt" asc limit 800`,
      [session.companyId, from, to]
    );
    return NextResponse.json({ meetings: rows });
  } catch {
    return NextResponse.json({ meetings: [] });
  }
}

/** Create a meeting in the signed-in workspace. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const title = String(body.title ?? "").trim();
  const startsAt = String(body.startsAt ?? "");
  const endsAt = String(body.endsAt ?? "");
  if (!title || !startsAt || !endsAt) return NextResponse.json({ error: "title, startsAt, endsAt required" }, { status: 400 });
  const id = newId();
  try {
    const { rows } = await pool(url).query(
      `insert into "calendar_meetings"
         (id, "companyId", "organizerId", title, description, "startsAt", "endsAt", "allDay", location, "meetingUrl", type, source, status, "createdAt", "updatedAt")
       values ($1,$2,$3,$4,$5,$6::timestamptz,$7::timestamptz,$8,$9,$10,$11,'xentral','confirmed',now(),now())
       returning id, title, description, "startsAt", "endsAt", "allDay", location, "meetingUrl", type, status, "organizerId"`,
      [id, session.companyId, session.userId, title, String(body.description ?? "") || null, startsAt, endsAt,
        Boolean(body.allDay), String(body.location ?? "") || null, String(body.meetingUrl ?? "") || null, String(body.type ?? "meeting") || "meeting"]
    );
    return NextResponse.json({ meeting: rows[0] }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}
