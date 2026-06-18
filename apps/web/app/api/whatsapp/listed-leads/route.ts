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

/** Listing/sale status for leads the operator has on the marketplace, keyed by phone.
 *  Lets the Inbox show "Listed" / "Sold AED X" badges next to WhatsApp conversations.
 *  SUPER_ADMIN sees the whole supply; a tenant sees only their own. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ leads: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = pool(url);
  try {
    const operator = session.role === "SUPER_ADMIN";
    const { rows } = operator
      ? await p.query(`select phone, status::text as status, "soldPrice", listing_type as "listingType", title from "marketplace_leads" where phone is not null and phone <> ''`)
      : await p.query(`select phone, status::text as status, "soldPrice", listing_type as "listingType", title from "marketplace_leads" where "companyId" = $1 and phone is not null and phone <> ''`, [session.companyId]);
    return NextResponse.json({ leads: rows });
  } catch {
    return NextResponse.json({ leads: [] });
  }
}
