import "server-only";
import "../../../../../lib/session";
import { NextResponse } from "next/server";
import { logAudit } from "../../../../..//lib/audit";
import { Pool } from "pg";
import { writeFile, mkdir, unlink } from "fs/promises";
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
function uploadRoot(): string { return process.env.UPLOAD_DIR || join(process.cwd(), "..", "..", "uploads"); }

/** GET — current company logo url. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ logo: null });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(`select logo from "companies" where id = $1`, [session.companyId]);
    return NextResponse.json({ logo: rows[0]?.logo || null });
  } catch { return NextResponse.json({ logo: null }); }
}

/** POST — upload company logo (PNG/JPG/SVG/WebP, max 2 MB). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 2 MB" }, { status: 400 });
  let ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  if (!["png", "jpg", "svg", "webp"].includes(ext)) return NextResponse.json({ error: "Use PNG, JPG, SVG or WebP" }, { status: 400 });

  const dir = join(uploadRoot(), "company");
  await mkdir(dir, { recursive: true });
  const filename = `${session.companyId}.${ext}`;
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  const fileUrl = `/api/uploads/company/${filename}?v=${Date.now()}`;
  try {
    await pool(url).query(`update "companies" set logo = $1, "updatedAt" = now() where id = $2`, [fileUrl, session.companyId]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 });
  }
  await logAudit("company.logo.update", { targetType: "company" });
  return NextResponse.json({ logo: fileUrl });
}

/** DELETE — remove company logo. */
export async function DELETE() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await pool(url).query(`update "companies" set logo = null, "updatedAt" = now() where id = $1`, [session.companyId]);
    for (const ext of ["png", "jpg", "svg", "webp"]) {
      try { await unlink(join(uploadRoot(), "company", `${session.companyId}.${ext}`)); } catch { /* ignore */ }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 });
  }
}
