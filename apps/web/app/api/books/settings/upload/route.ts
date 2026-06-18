import "server-only";
import "../../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { writeFile, mkdir } from "fs/promises";
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
const newId = () => "bs" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/** Books designer — logo / signature upload (png/jpg, max 2 MB) */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const kind = fd.get("kind") === "signature" ? "signature" : "logo";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 2 MB" }, { status: 400 });
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!["png", "jpg", "jpeg"].includes(ext)) return NextResponse.json({ error: "Only PNG and JPG are supported" }, { status: 400 });

  const dir = join(process.cwd(), "public", "billing");
  await mkdir(dir, { recursive: true });
  const filename = `${session.companyId}-${kind}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  const fileUrl = `/billing/${filename}?v=${Date.now()}`;
  const colName = kind === "logo" ? "logoUrl" : "signatureUrl";

  try {
    const p = pool(url);
    const existing = await p.query(`select id from "billing_settings" where "companyId" = $1`, [session.companyId]);
    if (existing.rows[0]) {
      await p.query(`update "billing_settings" set "${colName}" = $1, "updatedAt" = now() where "companyId" = $2`, [fileUrl, session.companyId]);
    } else {
      await p.query(`insert into "billing_settings" (id,"companyId","${colName}","createdAt","updatedAt") values ($1,$2,$3,now(),now())`, [newId(), session.companyId, fileUrl]);
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ url: fileUrl });
}
