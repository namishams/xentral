/**
 * @xentral/module-crm — PUBLIC CONTRACT.
 * The only surface other packages may import.
 */
import { getDataSource, hasDataSource, type TenantScope } from "@xentral/kernel";

export type PipelineStage = { id: string; label: string; order: number };
export function getDefaultPipeline(): PipelineStage[] {
  return [
    { id: "new", label: "New", order: 1 },
    { id: "qualified", label: "Qualified", order: 2 },
    { id: "proposal", label: "Proposal", order: 3 },
    { id: "won", label: "Won", order: 4 },
    { id: "lost", label: "Lost", order: 5 },
  ];
}

export type DealStage = "new" | "qualified" | "proposal" | "won" | "lost";
export type DealRow = {
  id: string;
  name: string;
  account: string;
  stage: DealStage;
  value: number;
  currency: string;
  owner: string;
};

/** List deals for the workspace. Seeded now; a real adapter replaces the body later. */
export function listDeals(): DealRow[] {
  return [
    { id: "d1", name: "Skyline Tower fit-out", account: "Skyline Developers", stage: "proposal", value: 480000, currency: "AED", owner: "Nami" },
    { id: "d2", name: "Office relocation", account: "Gulf Trading", stage: "qualified", value: 120000, currency: "AED", owner: "Sara" },
    { id: "d3", name: "Brokerage retainer", account: "Al Noor Real Estate", stage: "won", value: 90000, currency: "AED", owner: "Nami" },
    { id: "d4", name: "Villa portfolio", account: "Damac Properties", stage: "new", value: 250000, currency: "AED", owner: "Omar" },
    { id: "d5", name: "Mall units", account: "Emaar Group", stage: "lost", value: 310000, currency: "AED", owner: "Sara" },
  ];
}

/* ── CRM core directories (Layer 2). Seeded; real adapters replace the bodies later. ── */

export type ContactRow = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  owner: string;
};

/**
 * Load contacts for a workspace.
 *
 * Goes through the kernel DataPort: if a live DataSource is registered AND a
 * tenant scope is supplied, returns real rows; otherwise falls back to the seed
 * directory below. This is the reusable migration pattern — the same shape every
 * Core page adopts to move from seed → live without touching the page's UI.
 */
export async function loadContacts(scope?: TenantScope): Promise<ContactRow[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listContacts(scope);
    return raw.map((r) => ({
      id: r.id,
      name: [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.firstName,
      title: r.title ?? "",
      company: r.accountName ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      owner: r.owner ?? "",
    }));
  }
  return listContacts();
}

/** Seed contact directory for the workspace. */
export function listContacts(): ContactRow[] {
  return [
    { id: "c1", name: "Aisha Rahman", title: "Procurement Lead", company: "Skyline Developers", email: "aisha@skyline.ae", phone: "+971 50 110 2200", owner: "Nami" },
    { id: "c2", name: "Omar Haddad", title: "CFO", company: "Gulf Trading", email: "omar@gulftrading.ae", phone: "+971 52 330 9087", owner: "Sara" },
    { id: "c3", name: "Lena Fischer", title: "Operations Manager", company: "Al Noor Real Estate", email: "lena@alnoor.ae", phone: "+971 55 778 0042", owner: "Nami" },
    { id: "c4", name: "Yusuf Khan", title: "Managing Director", company: "Damac Properties", email: "yusuf@damac.ae", phone: "+971 50 901 7765", owner: "Omar" },
    { id: "c5", name: "Mariam Saleh", title: "Buyer", company: "Emaar Group", email: "mariam@emaar.ae", phone: "+971 56 220 3318", owner: "Sara" },
  ];
}

export type CompanyRow = {
  id: string;
  name: string;
  industry: string;
  city: string;
  country: string;
  segment: string;
  contacts: number;
  openDeals: number;
  owner: string;
};

/** Load companies for a workspace via the DataPort; seed fallback on preview. */
export async function loadCompanies(scope?: TenantScope): Promise<CompanyRow[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listCompanies(scope);
    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      industry: r.industry ?? "",
      city: r.city ?? "",
      country: r.country ?? "",
      segment: r.segment ?? "",
      contacts: r.contacts ?? 0,
      openDeals: r.openDeals ?? 0,
      owner: r.owner ?? "",
    }));
  }
  return listCompanies();
}

/** Seed company directory for the workspace. */
export function listCompanies(): CompanyRow[] {
  return [
    { id: "a1", name: "Skyline Developers", industry: "Construction", city: "Dubai", country: "UAE", segment: "Enterprise", contacts: 4, openDeals: 3, owner: "Nami" },
    { id: "a2", name: "Gulf Trading", industry: "Wholesale", city: "Sharjah", country: "UAE", segment: "SMB", contacts: 2, openDeals: 1, owner: "Sara" },
    { id: "a3", name: "Al Noor Real Estate", industry: "Real Estate", city: "Abu Dhabi", country: "UAE", segment: "Mid-Market", contacts: 3, openDeals: 2, owner: "Nami" },
    { id: "a4", name: "Damac Properties", industry: "Real Estate", city: "Dubai", country: "UAE", segment: "Enterprise", contacts: 6, openDeals: 4, owner: "Omar" },
    { id: "a5", name: "Emaar Group", industry: "Real Estate", city: "Dubai", country: "UAE", segment: "Enterprise", contacts: 5, openDeals: 1, owner: "Sara" },
  ];
}

export type LeadStage = "new" | "working" | "qualified" | "unqualified";
export type LeadRow = {
  id: string;
  name: string;
  company: string;
  source: string;
  score: number;
  stage: LeadStage;
  owner: string;
};

const LEAD_STAGES: LeadStage[] = ["new", "working", "qualified", "unqualified"];
function normalizeStage(raw?: string): LeadStage {
  const s = (raw ?? "").toLowerCase();
  return (LEAD_STAGES as string[]).includes(s) ? (s as LeadStage) : "new";
}

/** Load leads for a workspace via the DataPort; seed fallback on preview. */
export async function loadLeads(scope?: TenantScope): Promise<LeadRow[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listLeads(scope);
    return raw.map((r) => ({
      id: r.id,
      name: [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.firstName,
      company: r.company ?? "",
      source: r.source ?? "",
      score: Math.max(0, Math.min(100, r.score ?? 0)),
      stage: normalizeStage(r.stage),
      owner: r.owner ?? "",
    }));
  }
  return listLeads();
}

/** Seed lead directory for the workspace. */
export function listLeads(): LeadRow[] {
  return [
    { id: "l1", name: "Hassan Ali", company: "Bright Interiors", source: "WhatsApp", score: 82, stage: "qualified", owner: "Nami" },
    { id: "l2", name: "Nadia Sterling", company: "Coastal Logistics", source: "Website", score: 64, stage: "working", owner: "Sara" },
    { id: "l3", name: "Karim Mansour", company: "Vertex Clinics", source: "Marketplace", score: 91, stage: "qualified", owner: "Omar" },
    { id: "l4", name: "Priya Nair", company: "Nair Consulting", source: "Referral", score: 40, stage: "new", owner: "Nami" },
    { id: "l5", name: "Tom Becker", company: "Becker GmbH", source: "Campaign", score: 28, stage: "unqualified", owner: "Sara" },
  ];
}

/* ── Activities (Universal Timeline) & Tasks ── */

export type ActivityRow = {
  id: string;
  type: string;
  summary: string;
  when: string;
  by: string;
};

/** Load activities for a workspace via the DataPort; seed fallback on preview. */
export async function loadActivities(scope?: TenantScope): Promise<ActivityRow[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listActivities(scope);
    return raw.map((r) => ({
      id: r.id,
      type: r.type,
      summary: (r.subject || r.content || "").slice(0, 120),
      when: r.createdAt,
      by: r.user ?? "",
    }));
  }
  return listActivities();
}

/** Seed activity timeline for the workspace. */
export function listActivities(): ActivityRow[] {
  return [
    { id: "ac1", type: "call", summary: "Discovery call — fit-out scope", when: "2026-06-15", by: "Nami" },
    { id: "ac2", type: "email", summary: "Sent proposal v2 to Gulf Trading", when: "2026-06-14", by: "Sara" },
    { id: "ac3", type: "note", summary: "Client prefers phased delivery", when: "2026-06-13", by: "Nami" },
    { id: "ac4", type: "meeting", summary: "Site visit booked for Villa portfolio", when: "2026-06-12", by: "Omar" },
    { id: "ac5", type: "whatsapp", summary: "Qualified inbound from Bright Interiors", when: "2026-06-11", by: "Nami" },
  ];
}

export type TaskPriority = "low" | "medium" | "high";
export type TaskRow = {
  id: string;
  title: string;
  due: string;
  priority: TaskPriority;
  done: boolean;
  owner: string;
};

const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
function normalizePriority(raw?: string): TaskPriority {
  const p = (raw ?? "").toLowerCase();
  return (TASK_PRIORITIES as string[]).includes(p) ? (p as TaskPriority) : "medium";
}

/** Load tasks for a workspace via the DataPort; seed fallback on preview. */
export async function loadTasks(scope?: TenantScope): Promise<TaskRow[]> {
  if (scope && hasDataSource()) {
    const raw = await getDataSource()!.listTasks(scope);
    return raw.map((r) => ({
      id: r.id,
      title: r.title,
      due: r.dueAt ?? "",
      priority: normalizePriority(r.priority),
      done: r.isCompleted,
      owner: r.owner ?? "",
    }));
  }
  return listTasks();
}

/** Seed task list for the workspace. */
export function listTasks(): TaskRow[] {
  return [
    { id: "tk1", title: "Send proposal to Skyline Developers", due: "2026-06-18", priority: "high", done: false, owner: "Nami" },
    { id: "tk2", title: "Follow up with Gulf Trading CFO", due: "2026-06-19", priority: "medium", done: false, owner: "Sara" },
    { id: "tk3", title: "Prepare villa portfolio quote", due: "2026-06-20", priority: "high", done: false, owner: "Omar" },
    { id: "tk4", title: "Archive lost Emaar deal", due: "2026-06-16", priority: "low", done: true, owner: "Sara" },
  ];
}

/* ── Universal Timeline ── a unified chronological feed composed from other
   sources through the same port. No new adapter needed: it merges loadActivities
   + loadTasks, so it works on live data and seed identically. ── */

export type TimelineKind = "activity" | "task";
export type TimelineEvent = {
  id: string;
  kind: TimelineKind;
  title: string;
  when: string;
  who: string;
  detail: string;
};

/** Load a merged, reverse-chronological timeline for the workspace. */
export async function loadTimeline(scope?: TenantScope): Promise<TimelineEvent[]> {
  const [acts, tasks] = await Promise.all([loadActivities(scope), loadTasks(scope)]);
  const events: TimelineEvent[] = [
    ...acts.map((a): TimelineEvent => ({ id: `a-${a.id}`, kind: "activity", title: a.summary, when: a.when, who: a.by, detail: a.type })),
    ...tasks.map((t): TimelineEvent => ({ id: `t-${t.id}`, kind: "task", title: t.title, when: t.due, who: t.owner, detail: t.done ? "done" : t.priority })),
  ];
  return events.sort((x, y) => (y.when || "").localeCompare(x.when || ""));
}
