import "server-only";
import "../../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

/** GET — answered Q&A for a lead (public to all buyers). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ questions: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(
      `select id, question, answer, "createdAt" from "lead_questions" where "leadId" = $1 and status = 'ANSWERED' order by "createdAt" desc`, [params.id]);
    return NextResponse.json({ questions: rows });
  } catch { return NextResponse.json({ questions: [] }); }
}

/** POST — ask a question about a lead. Operator answers it in the Admin console. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const question = String(b.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });
  try {
    const id = randomUUID();
    await pool(url).query(
      `insert into "lead_questions" (id, "leadId", "companyId", question, status, "createdAt", "updatedAt") values ($1,$2,$3,$4,'PENDING', now(), now())`,
      [id, params.id, session.companyId, question]);
    return NextResponse.json({ success: true, id });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
