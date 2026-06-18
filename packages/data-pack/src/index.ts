/**
 * @xentral/data-pack — live data source adapter (ports & adapters).
 *
 * Implements the kernel DataSource port against the EXISTING app's Postgres
 * schema (read-only). It carries NO database driver dependency: the caller
 * injects a `QueryFn` at boot (e.g. a node-postgres client), which keeps this
 * package driver-agnostic, unit-testable, and absent from the public preview
 * bundle. Registered via setDataSource() only in a private/authenticated host.
 */
import type { DataSource, TenantScope, RawContact, RawCompany, RawLead, RawActivity, RawTask, RawUser, RawMarketLead } from "@xentral/kernel";

/** Minimal query surface — satisfied by `pg`'s Client.query, or any equivalent. */
export type QueryFn = (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function dstr(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

/**
 * Build a live DataSource from an injected query function.
 * All reads are tenant-isolated by companyId (the workspace key).
 */
export function createLiveDataSource(query: QueryFn): DataSource {
  return {
    async listContacts(scope: TenantScope): Promise<RawContact[]> {
      const { rows } = await query(
        `select c."id", c."firstName", c."lastName", c."title", c."email", c."phone",
                a."name" as "accountName", u."name" as "owner"
           from "contacts" c
           left join "accounts" a on a."id" = c."accountId"
           left join "users" u on u."id" = coalesce(c."assignedToId", c."ownerId")
          where c."companyId" = $1 and c."isArchived" = false
          order by c."createdAt" desc
          limit 500`,
        [scope.companyId],
      );
      return rows.map((r) => ({
        id: String(r.id),
        firstName: str(r.firstName) ?? "",
        lastName: str(r.lastName),
        title: str(r.title),
        email: str(r.email),
        phone: str(r.phone),
        accountName: str(r.accountName),
        owner: str(r.owner),
      }));
    },

    async listCompanies(scope: TenantScope): Promise<RawCompany[]> {
      const { rows } = await query(
        `select a."id", a."name", a."industry", a."city", a."country", a."segment",
                u."name" as "owner",
                (select count(*)::int from "leads" l where l."accountId" = a."id") as "openDeals",
                (select count(*)::int from "contacts" ct where ct."accountId" = a."id") as "contacts"
           from "accounts" a
           left join "users" u on u."id" = a."ownerId"
          where a."companyId" = $1 and a."isArchived" = false
          order by a."createdAt" desc
          limit 500`,
        [scope.companyId],
      );
      return rows.map((r) => ({
        id: String(r.id),
        name: str(r.name) ?? "",
        industry: str(r.industry),
        city: str(r.city),
        country: str(r.country),
        segment: str(r.segment),
        owner: str(r.owner),
        openDeals: typeof r.openDeals === "number" ? r.openDeals : Number(r.openDeals ?? 0),
        contacts: typeof r.contacts === "number" ? r.contacts : Number(r.contacts ?? 0),
      }));
    },

    async listLeads(scope: TenantScope): Promise<RawLead[]> {
      const { rows } = await query(
        `select l."id", l."firstName", l."lastName", l."company", l."source",
                l."status", l."probability", u."name" as "owner"
           from "leads" l
           left join "users" u on u."id" = l."assignedToId"
          where l."companyId" = $1
          order by l."createdAt" desc
          limit 500`,
        [scope.companyId],
      );
      return rows.map((r) => ({
        id: String(r.id),
        firstName: str(r.firstName) ?? "",
        lastName: str(r.lastName),
        company: str(r.company),
        source: str(r.source),
        score: typeof r.probability === "number" ? r.probability : Number(r.probability ?? 0),
        stage: str(r.status),
        owner: str(r.owner),
      }));
    },

    async listActivities(scope: TenantScope): Promise<RawActivity[]> {
      const { rows } = await query(
        `select a."id", a."type", a."subject", a."content", a."isCompleted", a."createdAt",
                u."name" as "user"
           from "activities" a
           left join "users" u on u."id" = a."userId"
          where a."companyId" = $1
          order by a."createdAt" desc
          limit 500`,
        [scope.companyId],
      );
      return rows.map((r) => ({
        id: String(r.id),
        type: str(r.type) ?? "note",
        subject: str(r.subject),
        content: str(r.content) ?? "",
        isCompleted: Boolean(r.isCompleted),
        createdAt: dstr(r.createdAt) ?? "",
        user: str(r.user),
      }));
    },

    async listTasks(scope: TenantScope): Promise<RawTask[]> {
      const { rows } = await query(
        `select t."id", t."title", t."dueAt", t."isCompleted", t."priority",
                u."name" as "owner"
           from "tasks" t
           left join "users" u on u."id" = t."assignedToId"
          where t."companyId" = $1
          order by t."createdAt" desc
          limit 500`,
        [scope.companyId],
      );
      return rows.map((r) => ({
        id: String(r.id),
        title: str(r.title) ?? "",
        dueAt: dstr(r.dueAt),
        isCompleted: Boolean(r.isCompleted),
        priority: str(r.priority) ?? "medium",
        owner: str(r.owner),
      }));
    },

    async listUsers(scope: TenantScope): Promise<RawUser[]> {
      const { rows } = await query(
        `select u."id", u."name", u."email", u."role", u."isActive", u."lastLoginAt"
           from "users" u
          where u."companyId" = $1
          order by u."name" asc
          limit 500`,
        [scope.companyId],
      );
      return rows.map((r) => ({
        id: String(r.id),
        name: str(r.name) ?? "",
        email: str(r.email) ?? "",
        role: str(r.role) ?? "member",
        isActive: Boolean(r.isActive),
        lastLoginAt: dstr(r.lastLoginAt),
      }));
    },
    async listMarketplaceLeads(_scope: TenantScope): Promise<RawMarketLead[]> {
      const { rows } = await query(
        'select id, specialty, category, "originRegion", "currentLocation", quality::text as quality, "viewCount", "watchCount", "maxPurchases", "purchaseCount", "isExclusive", "initialPrice", "minPrice", "decayAmount", "decayInterval", "listedAt", "firstName", "lastName", phone, "hasPhone", "hasWhatsApp", "hasEmail", "hasLinkedIn", "hasCV", "hasDataflow" from "marketplace_leads" where status = $1 and "purchaseCount" < "maxPurchases" order by "listedAt" desc limit 200',
        ["AVAILABLE"],
      );
      return rows.map((r) => ({
        id: String(r.id),
        specialty: str(r.specialty) ?? "",
        category: str(r.category) ?? "",
        originRegion: str(r.originRegion) ?? "",
        currentLocation: str(r.currentLocation),
        quality: str(r.quality) ?? "WARM",
        viewCount: Number(r.viewCount) || 0,
        watchCount: Number(r.watchCount) || 0,
        maxPurchases: Number(r.maxPurchases) || 1,
        purchaseCount: Number(r.purchaseCount) || 0,
        isExclusive: Boolean(r.isExclusive),
        initialPrice: Number(r.initialPrice) || 0,
        minPrice: Number(r.minPrice) || 0,
        decayAmount: Number(r.decayAmount) || 0,
        decayInterval: Number(r.decayInterval) || 6,
        listedAt: dstr(r.listedAt) ?? new Date().toISOString(),
        firstName: str(r.firstName),
        lastName: str(r.lastName),
        phone: str(r.phone),
        hasPhone: Boolean(r.hasPhone),
        hasWhatsApp: Boolean(r.hasWhatsApp),
        hasEmail: Boolean(r.hasEmail),
        hasLinkedIn: Boolean(r.hasLinkedIn),
        hasCV: Boolean(r.hasCV),
        hasDataflow: Boolean(r.hasDataflow),
      })) as RawMarketLead[];
    },
  };
}
