import "server-only";
import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, normalize } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Persistent upload root — lives at repo root (/var/www/xentral/uploads), survives rebuilds.
 *  next start does NOT serve files written to /public at runtime, so all uploaded files are
 *  streamed through this route instead. */
function root(): string {
  return process.env.UPLOAD_DIR || join(process.cwd(), "..", "..", "uploads");
}

const TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
  pdf: "application/pdf", csv: "text/csv", txt: "text/plain",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/** GET /api/uploads/<...key> — stream a stored file by relative key. */
export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  const rel = (params.key || []).join("/");
  if (!rel || rel.includes("..") || rel.includes("\0")) return NextResponse.json({ error: "Bad path" }, { status: 400 });
  const base = root();
  const abs = normalize(join(base, rel));
  if (!abs.startsWith(normalize(base))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const s = await stat(abs);
    if (!s.isFile()) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const buf = await readFile(abs);
    const ext = (rel.split(".").pop() || "").toLowerCase();
    const ct = TYPES[ext] || "application/octet-stream";
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": ct, "Cache-Control": "public, max-age=86400", "Content-Length": String(s.size) },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
