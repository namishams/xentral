import "server-only";
import "../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { resolveSession } from "@xentral/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight identity endpoint for the client shell (role-aware nav). */
export async function GET() {
  const s = await resolveSession();
  if (!s) return NextResponse.json({ authenticated: false, superAdmin: false });
  return NextResponse.json({
    authenticated: true,
    userId: s.userId,
    companyId: s.companyId,
    role: s.role,
    superAdmin: s.role === "SUPER_ADMIN",
  });
}
