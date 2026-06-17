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
const newId = () => "cm" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
const s = (v: unknown) => { const t = String(v ?? "").trim(); return t || null; };

/** Create a CRM record (contact | company | lead) in the signed-in workspace. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const entity = String(b.entity ?? "");
  const id = newId();
  const cid = session.companyId;
  try {
    const p = pool(url);
    if (entity === "contact") {
      const first = s(b.firstName);
      if (!first) return NextResponse.json({ error: "First name required" }, { status: 400 });
      await p.query(
        `insert into "contacts" (id, "firstName", "lastName", email, phone, title, "companyId", status, "isArchived", tags, "createdAt", "updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,'NEW',false,'{}',now(),now())`,
        [id, first, s(b.lastName), s(b.email), s(b.phone), s(b.title), cid]);
    } else if (entity === "company") {
      const name = s(b.name);
      if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      await p.query(
        `insert into "accounts" (id, name, industry, website, email, phone, city, "companyId", "isArchived", tags, "createdAt", "updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,$8,false,'{}',now(),now())`,
        [id, name, s(b.industry), s(b.website), s(b.email), s(b.phone), s(b.city), cid]);
    } else if (entity === "lead") {
      const first = s(b.firstName);
      if (!first) return NextResponse.json({ error: "First name required" }, { status: 400 });
      const value = Number(b.value); const v = Number.isFinite(value) ? value : 0;
      await p.query(
        `insert into "leads" (id, "firstName", "lastName", company, email, phone, value, source, status, currency, country, position, tags, "createdAt", "updatedAt", "companyId")
         values ($1,$2,$3,$4,$5,$6,$7,'OTHER','NEW','AED','UAE',0,'{}',now(),now(),$8)`,
        [id, first, s(b.lastName) ?? "", s(b.company), s(b.email), s(b.phone), v, cid]);
    } else {
      return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
    }
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
