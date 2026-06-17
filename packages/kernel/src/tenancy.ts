export type Tenant = { id: string; name: string };
export type Session = { userId: string; companyId: string; role: string };

/** Every module query must be scoped by this. Throws if a session lacks a tenant. */
export function requireCompany(session: Session): string {
  if (!session.companyId) throw new Error("tenant-scope-required");
  return session.companyId;
}
