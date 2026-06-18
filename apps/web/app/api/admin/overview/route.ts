import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}
const N = (v: unknown) => Number(v ?? 0);

/** Cross-tenant platform overview. SUPER_ADMIN (Xentral operator) only. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ ok: false, tenants: [], totals: {}, supply: {} });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = pool(url);
  try {
    const tenants = (await p.query(
      `select c.id, c.name, coalesce(c.credits,0)::int as credits,
              to_char(c."createdAt", 'DD Mon YYYY') as joined,
              (select count(*)::int from users u where u."companyId" = c.id) as users,
              (select count(*)::int from contacts ct where ct."companyId" = c.id) as contacts
         from companies c order by c."createdAt" asc`,
    )).rows.map((r) => ({ ...r, credits: N(r.credits), users: N(r.users), contacts: N(r.contacts) }));

    let supply = { listed: 0, available: 0, purchases: 0, value: 0 };
    try {
      const sup = (await p.query(
        `select count(*)::int as listed,
                count(*) filter (where status = 'AVAILABLE' and "purchaseCount" < "maxPurchases")::int as available,
                coalesce(sum("purchaseCount"),0)::int as purchases,
                coalesce(sum("initialPrice"),0)::numeric as value
           from "marketplace_leads"`,
      )).rows[0];
      supply = { listed: N(sup?.listed), available: N(sup?.available), purchases: N(sup?.purchases), value: N(sup?.value) };
    } catch { /* marketplace table may be empty/absent on some envs */ }

    const totals = {
      tenants: tenants.length,
      users: tenants.reduce((a, t) => a + N(t.users), 0),
      credits: tenants.reduce((a, t) => a + N(t.credits), 0),
    };
    return NextResponse.json({ ok: true, tenants, totals, supply });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 });
  }
}
