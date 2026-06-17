/**
 * DataPort — swappable data source (ports & adapters), like LocaleCore / UpdatePort.
 *
 * The kernel defines the SHAPE of raw records and a registry slot. Concrete
 * adapters (e.g. a live Postgres read of the existing app, or a seed source)
 * are registered at boot via setDataSource(). Modules never import an adapter
 * directly — they go through getDataSource(), so the source is swappable per
 * profile and stays absent (→ seed fallback) on the public preview.
 */

/** Tenant scope — every read is isolated to one workspace (companyId = tenant). */
export type TenantScope = { companyId: string };

/** Raw contact as read from a data source (pre-mapping; module maps to its row). */
export type RawContact = {
  id: string;
  firstName: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  accountName?: string;
  owner?: string;
};

/** Raw company/account as read from a data source. */
export type RawCompany = {
  id: string;
  name: string;
  industry?: string;
  city?: string;
  openDeals?: number;
  owner?: string;
};

/** Raw lead as read from a data source. */
export type RawLead = {
  id: string;
  firstName: string;
  lastName?: string;
  company?: string;
  source?: string;
  score?: number;
  stage?: string;
  owner?: string;
};

/** Raw activity (timeline event) as read from a data source. */
export type RawActivity = {
  id: string;
  type: string;
  subject?: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
  user?: string;
};

/** Raw task as read from a data source. */
export type RawTask = {
  id: string;
  title: string;
  dueAt?: string;
  isCompleted: boolean;
  priority: string;
  owner?: string;
};

/** Raw user (workspace member) as read from a data source. */
export type RawUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
};

/** The port every data adapter implements. Grows one method per migrated area. */
/** Raw marketplace lead (Mediflow lead-sale connector) as read from a data source. */
export type RawMarketLead = {
  id: string;
  specialty: string;
  category: string;
  originRegion: string;
  currentLocation?: string;
  quality: string;
  viewCount: number;
  watchCount: number;
  maxPurchases: number;
  purchaseCount: number;
  isExclusive: boolean;
  initialPrice: number;
  minPrice: number;
  decayAmount: number;
  decayInterval: number;
  listedAt: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  hasPhone: boolean;
  hasWhatsApp: boolean;
  hasEmail: boolean;
  hasLinkedIn: boolean;
  hasCV: boolean;
  hasDataflow: boolean;
};

export interface DataSource {
  listContacts(scope: TenantScope): Promise<RawContact[]>;
  listCompanies(scope: TenantScope): Promise<RawCompany[]>;
  listLeads(scope: TenantScope): Promise<RawLead[]>;
  listActivities(scope: TenantScope): Promise<RawActivity[]>;
  listTasks(scope: TenantScope): Promise<RawTask[]>;
  listUsers(scope: TenantScope): Promise<RawUser[]>;
  listMarketplaceLeads(scope: TenantScope): Promise<RawMarketLead[]>;
}

let _ds: DataSource | null = null;

/** Register the active data source (boot-time, by profile/env). */
export function setDataSource(ds: DataSource): void {
  _ds = ds;
}

/** The active data source, or null when none is registered (→ seed fallback). */
export function getDataSource(): DataSource | null {
  return _ds;
}

/** Whether a live data source is registered. */
export function hasDataSource(): boolean {
  return _ds !== null;
}

/** Test helper — clears the registered source. */
export function __resetDataSource(): void {
  _ds = null;
}
