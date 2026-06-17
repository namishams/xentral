import "server-only";
import { Pool } from "pg";
import { setDataSource } from "@xentral/kernel";
import { createLiveDataSource } from "@xentral/data-pack";

/**
 * Live data boot — registers the Postgres-backed DataSource against the existing
 * app's schema. DORMANT by default: only activates when XENTRAL_LIVE_DATA=1 and
 * DATABASE_URL are set (i.e. a private/authenticated host). On the public preview
 * the flag is unset, so no DB connection is made and pages fall back to seed.
 * Even when active, reads require a tenant scope from the SessionPort, so nothing
 * leaks without an authenticated session. "server-only" keeps pg out of the client bundle.
 */
let registered = false;
export function ensureLiveData(): void {
  if (registered) return;
  if (process.env.XENTRAL_LIVE_DATA !== "1") return;
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@\/]+):(\d+)\/([^?]+)/);
  const pool = m
    ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 5 })
    : new Pool({ connectionString: url, max: 5 });
  setDataSource(createLiveDataSource((sql, params) => pool.query(sql, params as unknown[])));
  registered = true;
}

ensureLiveData();
