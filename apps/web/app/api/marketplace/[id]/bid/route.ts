import "server-only";
import "../../../../../lib/session";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { sendOutbidEmail, sendBidPlacedEmail } from "../../../../../lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

const BID_TYPES = ["best_offer", "BID", "AUCTION", "BID_OFFER"];

/** GET — bid context for the signed-in buyer: count, highest, my bid, my rank, min bid, close time. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ bidCount: 0, highBid: 0, myBid: null, myRank: null });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = pool(url);
  try {
    const [lead, bids] = await Promise.all([
      p.query(`select min_bid, reserve_price, bids_close_at, listing_type from "marketplace_leads" where id = $1`, [params.id]),
      p.query(`select amount, "companyId", status from "marketplace_bids" where "leadId" = $1 and status in ('PENDING','ACCEPTED') order by amount desc`, [params.id]),
    ]);
    const amounts = bids.rows.map((r) => Number(r.amount));
    const mine = bids.rows.find((r) => r.companyId === session.companyId);
    const myBid = mine ? Number(mine.amount) : null;
    const myRank = myBid != null ? amounts.indexOf(myBid) + 1 : null;
    return NextResponse.json({
      bidCount: bids.rows.length,
      highBid: amounts[0] ?? 0,
      myBid, myRank,
      minBid: lead.rows[0]?.min_bid != null ? Number(lead.rows[0].min_bid) : null,
      closeAt: lead.rows[0]?.bids_close_at ?? null,
      listingType: lead.rows[0]?.listing_type ?? null,
    });
  } catch { return NextResponse.json({ bidCount: 0, highBid: 0, myBid: null, myRank: null }); }
}

/** POST — place or update an offer. Validates listing type, min bid, close time and credits;
 *  marks lower competing bids OUTBID when this becomes the new highest. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const amount = Number(b.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid offer amount" }, { status: 400 });
  const message = b.message == null ? null : String(b.message);
  const p = pool(url); const leadId = params.id;
  try {
    const lr = await p.query(`select status::text as status, listing_type, min_bid, bids_close_at, specialty from "marketplace_leads" where id = $1 limit 1`, [leadId]);
    const lead = lr.rows[0];
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.status !== "AVAILABLE") return NextResponse.json({ error: "Lead no longer available" }, { status: 409 });
    if (lead.listing_type && !BID_TYPES.includes(String(lead.listing_type))) {
      return NextResponse.json({ error: "This lead is not accepting offers" }, { status: 400 });
    }
    if (lead.bids_close_at && new Date() > new Date(lead.bids_close_at)) {
      return NextResponse.json({ error: "Bidding has closed" }, { status: 400 });
    }
    if (lead.min_bid != null && amount < Number(lead.min_bid)) {
      return NextResponse.json({ error: `Minimum offer is AED ${Number(lead.min_bid).toLocaleString()}` }, { status: 400 });
    }
    const comp = await p.query(`select coalesce(credits,0)::int as credits from "companies" where id = $1`, [session.companyId]);
    if (Number(comp.rows[0]?.credits ?? 0) < amount) {
      return NextResponse.json({ error: "Insufficient credits", credits: Number(comp.rows[0]?.credits ?? 0), required: amount }, { status: 402 });
    }

    const ex = await p.query(`select id from "marketplace_bids" where "leadId" = $1 and "companyId" = $2 limit 1`, [leadId, session.companyId]);
    if (ex.rowCount) {
      await p.query(`update "marketplace_bids" set amount = $1, message = $2, status = 'PENDING', "updatedAt" = now() where id = $3`, [amount, message, ex.rows[0].id]);
    } else {
      await p.query(`insert into "marketplace_bids" (id, amount, message, status, "leadId", "companyId", "createdAt", "updatedAt") values ($1,$2,$3,'PENDING',$4,$5, now(), now())`,
        [randomUUID(), amount, message, leadId, session.companyId]);
    }

    // If this is now the highest, mark competitors OUTBID and e-mail them.
    const spec = String(lead.specialty || "Lead");
    const high = await p.query(`select max(amount)::numeric as m from "marketplace_bids" where "leadId" = $1 and "companyId" <> $2 and status = 'PENDING'`, [leadId, session.companyId]);
    if (high.rows[0]?.m != null && amount > Number(high.rows[0].m)) {
      let outbid: { email: string; name: string; amount: number }[] = [];
      try {
        outbid = (await p.query(
          `select distinct on (b."companyId") u.email, u.name, b.amount from "marketplace_bids" b
             join "users" u on u."companyId" = b."companyId"
            where b."leadId" = $1 and b."companyId" <> $2 and b.status = 'PENDING' and u.email is not null
            order by b."companyId", (u.role in ('ADMIN','SUPER_ADMIN')) desc, u."createdAt" asc`, [leadId, session.companyId])
        ).rows.map((r) => ({ email: String(r.email), name: String(r.name || "there"), amount: Number(r.amount) }));
      } catch { /* noop */ }
      await p.query(`update "marketplace_bids" set status = 'OUTBID', "updatedAt" = now() where "leadId" = $1 and "companyId" <> $2 and status = 'PENDING'`, [leadId, session.companyId]);
      for (const o of outbid) { try { await sendOutbidEmail({ to: o.email, name: o.name, leadSpecialty: spec, yourBid: o.amount, newHighBid: amount, leadId }); } catch { /* noop */ } }
    }
    // Confirm the bid to the bidder.
    try { const me = (await p.query(`select email, name from "users" where id = $1`, [session.userId])).rows[0]; if (me?.email) await sendBidPlacedEmail({ to: String(me.email), name: String(me.name || "there"), leadSpecialty: spec, amount, leadId }); } catch { /* noop */ }

    const cnt = await p.query(`select count(*)::int as n from "marketplace_bids" where "leadId" = $1`, [leadId]);
    return NextResponse.json({ ok: true, success: true, amount, bidCount: Number(cnt.rows[0].n) });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
