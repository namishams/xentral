import "server-only";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sign out — clears the session cookie. Safe on preview (nothing to clear). */
function clear(redirect: boolean, origin: string) {
  const res = redirect ? NextResponse.redirect(new URL("/auth/login", origin)) : NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  return clear(false, new URL(req.url).origin);
}
export async function GET(req: Request) {
  return clear(true, new URL(req.url).origin);
}
