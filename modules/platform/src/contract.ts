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

/* ── Platform Admin (cross-tenant SaaS operator view). Seeded, fictional. ── */

export type TenantStatus = "active" | "trial" | "suspended";
export type TenantRow = {
  id: string;
  name: string;
  plan: string;
  users: number;
  mrr: number;
  status: TenantStatus;
  joined: string;
};
export function listTenants(): TenantRow[] {
  return [
    { id: "t1", name: "ICSL FZE", plan: "Growth", users: 16, mrr: 999, status: "active", joined: "Jan 2026" },
    { id: "t2", name: "Damac Properties", plan: "Enterprise", users: 42, mrr: 2400, status: "active", joined: "Feb 2026" },
    { id: "t3", name: "Bright Interiors", plan: "Starter", users: 5, mrr: 299, status: "trial", joined: "Jun 2026" },
    { id: "t4", name: "Coastal Logistics", plan: "Growth", users: 11, mrr: 999, status: "active", joined: "Mar 2026" },
    { id: "t5", name: "Vertex Clinics", plan: "Growth", users: 9, mrr: 999, status: "suspended", joined: "Apr 2026" },
  ];
}

export type SaasMetrics = { mrr: number; arr: number; activeTenants: number; trials: number; churnPct: number; newThisMonth: number };
export function getSaasMetrics(): SaasMetrics {
  const t = listTenants();
  const mrr = t.filter((x) => x.status === "active").reduce((s, x) => s + x.mrr, 0);
  return { mrr, arr: mrr * 12, activeTenants: t.filter((x) => x.status === "active").length, trials: t.filter((x) => x.status === "trial").length, churnPct: 2.1, newThisMonth: 3 };
}

export type DisputeStatus = "open" | "escalated" | "resolved";
export type DisputeRow = { id: string; tenant: string; subject: string; amount: number; status: DisputeStatus; age: string };
export function listDisputes(): DisputeRow[] {
  return [
    { id: "d1", tenant: "Bright Interiors", subject: "Lead quality — refund request", amount: 320, status: "open", age: "2d" },
    { id: "d2", tenant: "Coastal Logistics", subject: "Double charge on top-up", amount: 999, status: "escalated", age: "4d" },
    { id: "d3", tenant: "Damac Properties", subject: "Disputed marketplace lead", amount: 280, status: "resolved", age: "1w" },
  ];
}

export type QuestionStatus = "open" | "answered";
export type QuestionRow = { id: string; tenant: string; question: string; status: QuestionStatus; age: string };
export function listQuestions(): QuestionRow[] {
  return [
    { id: "q1", tenant: "ICSL FZE", question: "How do I enable FTA e-invoicing for my TRN?", status: "open", age: "3h" },
    { id: "q2", tenant: "Vertex Clinics", question: "Can I export the audit log for ISO?", status: "answered", age: "1d" },
    { id: "q3", tenant: "Bright Interiors", question: "Is WhatsApp included in the Starter plan?", status: "open", age: "2d" },
  ];
}

export type AnnouncementStatus = "draft" | "published";
export type AnnouncementRow = { id: string; title: string; audience: string; status: AnnouncementStatus; date: string };
export function listAnnouncements(): AnnouncementRow[] {
  return [
    { id: "a1", title: "New: Corporate Tax (9%) engine is live", audience: "All tenants", status: "published", date: "12 Jun" },
    { id: "a2", title: "Scheduled maintenance — 22 Jun, 02:00 GST", audience: "All tenants", status: "published", date: "10 Jun" },
    { id: "a3", title: "Beta: AI deal copilot", audience: "Growth + Enterprise", status: "draft", date: "—" },
  ];
}
