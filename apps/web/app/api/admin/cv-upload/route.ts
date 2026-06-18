import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { resolveSession } from "@xentral/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newId = () => "cv" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** CV / resume upload for marketplace leads. SUPER_ADMIN only. Stores under /public/cv and returns a served URL. */
export async function POST(req: Request) {
  if (process.env.XENTRAL_LIVE_DATA !== "1") return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 5 MB" }, { status: 400 });
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext)) return NextResponse.json({ error: "Only PDF, DOC, JPG are supported" }, { status: 400 });

  try {
    const dir = join(process.cwd(), "public", "cv");
    await mkdir(dir, { recursive: true });
    const filename = `${newId()}.${ext === "jpeg" ? "jpg" : ext}`;
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/cv/${filename}` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Upload failed" }, { status: 500 });
  }
}
