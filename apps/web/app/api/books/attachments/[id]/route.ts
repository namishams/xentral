import "server-only";
import "../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { unlink } from "fs/promises";
import { join } from "path";
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

/** Remove an attachment (tenant-scoped). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = pool(url);
    const r = await p.query(`select "filePath" from "document_attachments" where id = $1 and "companyId" = $2`, [params.id, session.companyId]);
    if (!r.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await p.query(`delete from "document_attachments" where id = $1 and "companyId" = $2`, [params.id, session.companyId]);
    const fp = String(r.rows[0].filePath || "");
    if (fp.startsWith("/attachments/")) { await unlink(join(process.cwd(), "public", fp)).catch(() => {}); }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Delete failed" }, { status: 500 });
  }
}
