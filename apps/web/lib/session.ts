import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { setSessionResolver, type Session } from "@xentral/kernel";

/**
 * Session resolver boot — registers the kernel SessionPort resolver.
 *
 * DORMANT by default. It only registers when XENTRAL_LIVE_DATA=1 (the same gate
 * that arms live data). Until then no resolver is registered, so currentScope()
 * returns undefined and every page falls back to safe seed data — the public
 * preview never sees a tenant.
 *
 * When armed, the resolver reads an HMAC-signed cookie ("xentral_session") of the
 * form  base64url(payloadJson) "." base64url(hmacSHA256(payloadJson, SECRET)).
 * It verifies the signature with XENTRAL_SESSION_SECRET (set only on the private
 * host). No secret, no cookie, or a bad signature → null (unauthenticated). The
 * payload carries { userId, companyId, role }; companyId is the tenant scope.
 *
 * This is the seam the existing Xentral auth plugs into at go-live: whatever
 * issues the cookie (the current login) just needs to sign it with the shared
 * secret. Nothing here trusts unsigned input, so it is safe to ship dormant.
 */

const COOKIE = "xentral_session";
const b64urlToBuf = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

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
      const token = cookies().get(COOKIE)?.value;
      return token ? verify(token, secret) : null;
    } catch {
      return null;
    }
  });
  registered = true;
}

ensureSessionResolver();
