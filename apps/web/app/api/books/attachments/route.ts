import "server-only";
import "../../../../lib/session";
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
const newId = () => "at" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const DOC_TYPES = ["QUOTE", "INVOICE", "CUSTOMER"];

/** List attachments for a document. ?docType=QUOTE&docId=… */
export async function GET(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json([]);
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const docType = String(sp.get("docType") || "").toUpperCase();
  const docId = String(sp.get("docId") || "");
  if (!DOC_TYPES.includes(docType) || !docId) return NextResponse.json([]);
  try {
    const { rows } = await pool(url).query(
      `select id, "fileName" as "fileName", size, "filePath" as "filePath", to_char("createdAt",'DD Mon YYYY') as "createdAt"
         from "document_attachments" where "companyId" = $1 and "docType" = $2 and "docId" = $3 order by "createdAt" desc`,
      [session.companyId, docType, docId]);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([]); }
}

/** Upload an attachment (max 10 MB). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const docType = String(fd.get("docType") || "").toUpperCase();
  const docId = String(fd.get("docId") || "");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!DOC_TYPES.includes(docType) || !docId) return NextResponse.json({ error: "Bad target" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 10 MB" }, { status: 400 });

  const safeName = (file.name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const stored = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const dir = join(process.cwd(), "public", "attachments", session.companyId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, stored), Buffer.from(await file.arrayBuffer()));
  const filePath = `/attachments/${session.companyId}/${stored}`;

  const id = newId();
  try {
    await pool(url).query(
      `insert into "document_attachments" (id,"companyId","docType","docId","fileName","filePath","mimeType",size,"uploadedById","createdAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`,
      [id, session.companyId, docType, docId, safeName, filePath, file.type || null, file.size, session.userId]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ id, fileName: safeName, size: file.size, filePath });
}
