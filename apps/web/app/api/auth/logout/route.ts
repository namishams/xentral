import "server-only";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sign out — clears the session cookie. Safe on preview (nothing to clear). */
function baseUrl(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
function clear(redirect: boolean, base: string) {
  const res = redirect ? NextResponse.redirect(new URL("/auth/login", base)) : NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  return clear(false, baseUrl(req));
}
export async function GET(req: Request) {
  return clear(true, baseUrl(req));
}
