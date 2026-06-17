import "server-only";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { signSession, SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sign-in — DORMANT until armed. Returns 503 unless XENTRAL_LIVE_DATA=1,
 * DATABASE_URL and XENTRAL_SESSION_SECRET are all set (the private host). When
 * armed, it verifies the email + bcrypt password against the existing "users"
 * table, then mints the HMAC-signed session cookie the SessionPort reads. The
 * public preview keeps the flags unset, so this endpoint never authenticates.
 */

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m
    ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 })
    : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

export async function POST(req: Request) {
  const secret = process.env.XENTRAL_SESSION_SECRET;
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !secret || !url) {
    return NextResponse.json({ error: "not_configured", message: "Sign-in activates when the workspace goes live." }, { status: 503 });
  }

  let email = "", password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!email || !password) return NextResponse.json({ error: "missing_credentials" }, { status: 400 });

  let row: { id: string; companyId: string; role: string; password: string; isActive: boolean } | undefined;
  try {
    const { rows } = await pool(url).query(
      `select "id", "companyId", "role", "password", "isActive" from "users" where lower("email") = $1 limit 1`,
      [email],
    );
    row = rows[0] as typeof row;
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Constant-ish path: always run a compare to reduce user-enumeration timing signal.
  const hash = row?.password ?? "$2a$12$0000000000000000000000000000000000000000000000000000";
  const ok = await bcrypt.compare(password, hash);
  if (!row || !row.isActive || !ok) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = signSession({ userId: String(row.id), companyId: String(row.companyId), role: String(row.role ?? "member") }, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
