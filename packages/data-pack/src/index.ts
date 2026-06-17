/**
 * @xentral/data-pack — live data source adapter (ports & adapters).
 *
 * Implements the kernel DataSource port against the EXISTING app's Postgres
 * schema (read-only). It carries NO database driver dependency: the caller
 * injects a `QueryFn` at boot (e.g. a node-postgres client), which keeps this
 * package driver-agnostic, unit-testable, and absent from the public preview
 * bundle. Registered via setDataSource() only in a private/authenticated host.
 */
import type { DataSource, TenantScope, RawContact } from "@xentral/kernel";

/** Minimal query surface — satisfied by `pg`'s Client.query, or any equivalent. */
export type QueryFn = (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
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
  };
}
