/**
 * SessionPort — swappable authentication seam (ports & adapters).
 *
 * The kernel owns the registry slot only; it never knows HOW a session is
 * produced. A host (the Next app) registers a resolver at boot — e.g. one that
 * verifies a cookie/JWT from the existing Xentral auth, or an OAuth session.
 * Until a resolver is registered, resolveSession() returns null and
 * currentScope() returns undefined → every data read falls back to seed. That
 * is what keeps the public preview safe: no resolver, no tenant, no real data.
 */
import type { Session } from "./tenancy";
import { requireCompany } from "./tenancy";
import type { TenantScope } from "./data";

/** Produces the current request's session, or null when unauthenticated. */
export type SessionResolver = () => Promise<Session | null> | Session | null;

let _resolver: SessionResolver | null = null;

/** Register the active session resolver (boot-time, by host/profile). */
export function setSessionResolver(r: SessionResolver): void {
  _resolver = r;
}

/** Whether a session resolver is registered. */
export function hasSessionResolver(): boolean {
  return _resolver !== null;
}

/** Test helper — clears the registered resolver. */
export function __resetSessionResolver(): void {
  _resolver = null;
}

/** Resolve the current session, or null when none / unauthenticated. */
export async function resolveSession(): Promise<Session | null> {
  if (!_resolver) return null;
  return await _resolver();
}

/**
 * Tenant scope for the current request, or undefined when unauthenticated.
 * Pages pass this straight to loadX(scope) — undefined → safe seed fallback.
 */
export async function currentScope(): Promise<TenantScope | undefined> {
  const s = await resolveSession();
  return s ? { companyId: requireCompany(s) } : undefined;
}
