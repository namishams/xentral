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
