import "server-only";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create account — DORMANT seam. Returns 503 until armed (XENTRAL_LIVE_DATA=1 +
 * DATABASE_URL + XENTRAL_SESSION_SECRET). The real registration backend (create
 * company + user, bcrypt hash, approval flow) is ported in the feature phase;
 * it writes to the DB, so it stays off until the workspace goes live. The public
 * preview never creates accounts.
 */
export async function POST() {
  return NextResponse.json(
    { error: "not_configured", message: "Account creation activates when the workspace goes live." },
    { status: 503 },
  );
}
