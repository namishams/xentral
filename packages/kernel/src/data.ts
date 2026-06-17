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

/** The port every data adapter implements. Grows one method per migrated area. */
export interface DataSource {
  listContacts(scope: TenantScope): Promise<RawContact[]>;
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
