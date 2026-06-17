/**
 * @xentral/module-platform — PUBLIC CONTRACT.
 * Identity & platform surfaces (users, roles, plans).
 */
import { getDataSource, hasDataSource, type TenantScope } from "@xentral/kernel";

export type PlanTier = { id: string; label: string };
export function getPlanTiers(): PlanTier[] {
  return [{ id: "free", label: "Free" }, { id: "pro", label: "Pro" }, { id: "enterprise", label: "Enterprise" }];
}

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin: string;
};

/** Load workspace members via the kernel DataPort; seed fallback on preview. */
export async function loadUsers(scope?: TenantScope): Promise<UserRow[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listUsers(scope);
    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      active: r.isActive,
      lastLogin: r.lastLoginAt ?? "",
    }));
  }
  return listUsers();
}

/** Seed member directory for the workspace. */
export function listUsers(): UserRow[] {
  return [
    { id: "u1", name: "Nami", email: "nami@xentral.ae", role: "owner", active: true, lastLogin: "2026-06-17" },
    { id: "u2", name: "Sara Khan", email: "sara@xentral.ae", role: "sales", active: true, lastLogin: "2026-06-16" },
    { id: "u3", name: "Omar Haddad", email: "omar@xentral.ae", role: "sales", active: true, lastLogin: "2026-06-15" },
    { id: "u4", name: "Lena Fischer", email: "lena@xentral.ae", role: "manager", active: true, lastLogin: "2026-06-14" },
    { id: "u5", name: "Tariq Aziz", email: "tariq@xentral.ae", role: "viewer", active: false, lastLogin: "2026-05-30" },
  ];
}

export type AuditEvent = {
  id: string;
  when: string;
  actor: string;
  action: string;
  target: string;
};

/** Immutable audit log feed for the workspace. Seeded now; a real adapter replaces the body later. */
export function listAuditEvents(): AuditEvent[] {
  return [
    { id: "a1", when: "2026-06-17 09:42", actor: "Nami", action: "invoice.sent", target: "INV-1042 · Gulf Trading" },
    { id: "a2", when: "2026-06-17 09:18", actor: "Sara Khan", action: "deal.updated", target: "Skyline Tower fit-out" },
    { id: "a3", when: "2026-06-16 17:05", actor: "system", action: "payment.received", target: "PAY-5522 · AED 5,725" },
    { id: "a4", when: "2026-06-16 14:30", actor: "Nami", action: "user.invited", target: "lena@xentral.ae" },
    { id: "a5", when: "2026-06-16 11:12", actor: "Omar Haddad", action: "contact.created", target: "Yusuf Khan" },
  ];
}

export type ApiKeyStatus = "active" | "revoked";
export type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  status: ApiKeyStatus;
};

/** List API keys for the workspace. Seeded now; a real adapter replaces the body later. */
export function listApiKeys(): ApiKeyRow[] {
  return [
    { id: "k1", name: "Production server", prefix: "xk_live_8f3a…", created: "12 May", lastUsed: "2 min ago", status: "active" },
    { id: "k2", name: "Zapier integration", prefix: "xk_live_2b9c…", created: "01 Jun", lastUsed: "1 h ago", status: "active" },
    { id: "k3", name: "Old mobile app", prefix: "xk_live_55ad…", created: "10 Feb", lastUsed: "30 d ago", status: "revoked" },
  ];
}

export type RoleRow = {
  id: string;
  name: string;
  members: number;
  permissions: number;
  scope: string;
};

/** List roles for the workspace. Seeded now; a real adapter replaces the body later. */
export function listRoles(): RoleRow[] {
  return [
    { id: "owner", name: "Owner", members: 1, permissions: 48, scope: "Full access" },
    { id: "admin", name: "Admin", members: 2, permissions: 42, scope: "Manage workspace" },
    { id: "manager", name: "Manager", members: 3, permissions: 30, scope: "Team + reports" },
    { id: "sales", name: "Sales", members: 6, permissions: 18, scope: "Own records" },
    { id: "viewer", name: "Viewer", members: 4, permissions: 6, scope: "Read only" },
  ];
}
