import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { setSessionResolver, type Session } from "@xentral/kernel";

/**
 * Session resolver boot + cookie signer for the kernel SessionPort.
 *
 * DORMANT by default. The resolver registers only when XENTRAL_LIVE_DATA=1 (the
 * same gate that arms live data). Until then no resolver is registered, so
 * currentScope() returns undefined and every page falls back to safe seed data —
 * the public preview never sees a tenant.
 *
 * Cookie format ("xentral_session"):
 *   base64url(payloadJson) "." base64url(hmacSHA256(payload, XENTRAL_SESSION_SECRET))
 * Signed and verified with XENTRAL_SESSION_SECRET (set only on the private host).
 * No secret, no cookie, or a bad signature → null (unauthenticated). Payload:
 * { userId, companyId, role }; companyId is the tenant scope.
 */

export const SESSION_COOKIE = "xentral_session";
const b64urlToBuf = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const bufToB64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Produce a signed session cookie value. Only the host that holds the secret can mint one. */
export function signSession(payload: Session, secret: string): string {
  const p = bufToB64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = bufToB64url(createHmac("sha256", secret).update(p).digest());
  return `${p}.${sig}`;
}

function verify(token: string, secret: string): Session | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payloadPart).digest();
  let given: Buffer;
  try { given = b64urlToBuf(sigPart); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const json = JSON.parse(b64urlToBuf(payloadPart).toString("utf8")) as Partial<Session>;
    if (!json.userId || !json.companyId) return null;
    return { userId: String(json.userId), companyId: String(json.companyId), role: String(json.role ?? "member") };
  } catch {
    return null;
  }
}

let registered = false;
export function ensureSessionResolver(): void {
  if (registered) return;
  if (process.env.XENTRAL_LIVE_DATA !== "1") return;
  const secret = process.env.XENTRAL_SESSION_SECRET;
  if (!secret) return;
  setSessionResolver((): Session | null => {
    try {
      const token = cookies().get(SESSION_COOKIE)?.value;
      return token ? verify(token, secret) : null;
    } catch {
      return null;
    }
  });
  registered = true;
}

ensureSessionResolver();
