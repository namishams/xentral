import "server-only";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { sendPurchaseConfirmation } from "../../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mediflow lead-sale — BUY (write side). DORMANT until armed (XENTRAL_LIVE_DATA=1
 * + DATABASE_URL + an authenticated session). Replicates the live app's purchase
 * exactly, as a serializable SQL transaction: re-check availability, block double
 * purchase, enforce suspension + daily limit, verify credits, then atomically
 * decrement credits, mark the lead, record the purchase and the credit ledger
 * entry. Contact auto-creation and the confirmation e-mail are best-effort. The
 * public preview keeps the flag unset → 503, no DB write, leads untouched.
 */

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m
    ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 })
    : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

function currentPrice(l: { initialPrice: number; minPrice: number; decayAmount: number; decayInterval: number; listedAt: Date }): number {
  const hrs = (Date.now() - new Date(l.listedAt).getTime()) / 3600000;
  const drops = Math.floor(hrs / Math.max(1, l.decayInterval));
  return Math.max(l.minPrice, l.initialPrice - drops * l.decayAmount);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) {
    return NextResponse.json({ error: "not_configured", message: "Marketplace activates when the workspace goes live." }, { status: 503 });
  }
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = session.companyId;
  const userId = session.userId;
  const leadId = params.id;

  const client = await pool(url).connect();
  let result: { price: number; balanceAfter: number; purchaseId: string; lead: Record<string, unknown> } | null = null;
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    const leadRes = await client.query(
      `select id, specialty, category, "originCountry", "firstName", "lastName", phone, email, "linkedIn", notes,
              "yearsExperience", quality::text as quality, "isExclusive", "maxPurchases", "purchaseCount",
              "initialPrice", "minPrice", "decayAmount", "decayInterval", "listedAt", status::text as status
         from "marketplace_leads" where id = $1 for update`, [leadId]);
    const lead = leadRes.rows[0];
    if (!lead) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Lead not found" }, { status: 404 }); }
    if (lead.status !== "AVAILABLE" || Number(lead.purchaseCount) >= Number(lead.maxPurchases)) {
      await client.query("ROLLBACK"); return NextResponse.json({ error: "Lead no longer available" }, { status: 409 });
    }

    const dup = await client.query(`select 1 from "marketplace_purchases" where "leadId" = $1 and "companyId" = $2 limit 1`, [leadId, companyId]);
    if (dup.rowCount) { await client.query("ROLLBACK"); return NextResponse.json({ error: "You already purchased this lead" }, { status: 409 }); }

    const compRes = await client.query(`select credits, "isSuspended", "marketplaceDailyLimit", name from "companies" where id = $1 for update`, [companyId]);
    const company = compRes.rows[0];
    if (!company) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Company not found" }, { status: 404 }); }
    if (company.isSuspended) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 }); }

    if (company.marketplaceDailyLimit != null) {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const cnt = await client.query(`select count(*)::int as n from "marketplace_purchases" where "companyId" = $1 and "purchasedAt" >= $2`, [companyId, since.toISOString()]);
      if (Number(cnt.rows[0].n) >= Number(company.marketplaceDailyLimit)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Daily purchase limit reached. Resets at midnight.", limit: company.marketplaceDailyLimit }, { status: 429 });
      }
    }

    const price = currentPrice({ initialPrice: Number(lead.initialPrice), minPrice: Number(lead.minPrice), decayAmount: Number(lead.decayAmount), decayInterval: Number(lead.decayInterval), listedAt: lead.listedAt });
    const balanceBefore = Number(company.credits);
    if (balanceBefore < price) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "insufficient_credits", credits: balanceBefore, required: price }, { status: 402 });
    }
    const balanceAfter = balanceBefore - price;
    const soldOut = Boolean(lead.isExclusive) || Number(lead.purchaseCount) + 1 >= Number(lead.maxPurchases);

    const credUpd = await client.query(`update "companies" set credits = credits - $1 where id = $2 and credits >= $1`, [price, companyId]);
    if (credUpd.rowCount !== 1) { await client.query("ROLLBACK"); return NextResponse.json({ error: "insufficient_credits", required: price }, { status: 402 }); }

    const leadUpd = await client.query(
      `update "marketplace_leads" set "purchaseCount" = "purchaseCount" + 1, "updatedAt" = now()` +
      (soldOut ? `, status = 'SOLD', "soldToId" = $2, "soldAt" = now(), "soldPrice" = $3` : ``) +
      ` where id = $1 and status = 'AVAILABLE' and "purchaseCount" < "maxPurchases"`,
      soldOut ? [leadId, companyId, price] : [leadId]);
    if (leadUpd.rowCount !== 1) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Lead no longer available" }, { status: 409 }); }

    const purchaseId = randomUUID();
    await client.query(`insert into "marketplace_purchases" (id, "leadId", "companyId", "pricePaid", "purchasedAt") values ($1,$2,$3,$4, now())`, [purchaseId, leadId, companyId, price]);
    await client.query(
      `insert into "credit_transactions" (id, "companyId", amount, type, description, "balanceBefore", "balanceAfter", "createdAt") values ($1,$2,$3,$4,$5,$6,$7, now())`,
      [randomUUID(), companyId, -price, "PURCHASE", `Lead purchased: ${lead.specialty} (${lead.category})`, balanceBefore, balanceAfter]);

    await client.query("COMMIT");
    result = { price, balanceAfter, purchaseId, lead };
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* noop */ }
    return NextResponse.json({ error: "Purchase conflicted. Please try again." }, { status: 409 });
  } finally {
    client.release();
  }

  const { price, balanceAfter, purchaseId, lead } = result;

  // best-effort: auto-create CRM contact (skip on any error)
  let contactId: string | null = null;
  try {
    const existing = await pool(url).query(`select id from "contacts" where "purchaseId" = $1 or (email is not null and email = $2 and "companyId" = $3) limit 1`, [purchaseId, lead.email ?? null, companyId]);
    if (existing.rowCount) contactId = String(existing.rows[0].id);
    else {
      contactId = randomUUID();
      await pool(url).query(
        `insert into "contacts" (id, "firstName", "lastName", email, phone, status, "companyId", "assignedToId", "purchaseId", "createdAt", "updatedAt")
         values ($1,$2,$3,$4,$5,'NEW',$6,$7,$8, now(), now())`,
        [contactId, lead.firstName ?? lead.specialty, lead.lastName ?? "", lead.email ?? null, lead.phone ?? null, companyId, userId, purchaseId]);
    }
  } catch { contactId = null; }

  // best-effort: purchase confirmation email
  try {
    const u = await pool(url).query(`select email, name from "users" where id = $1 limit 1`, [userId]);
    const buyer = u.rows[0];
    if (buyer?.email) {
      await sendPurchaseConfirmation({
        buyerEmail: String(buyer.email), buyerName: String(buyer.name ?? "Customer"), companyName: "Your workspace",
        lead: { firstName: lead.firstName as string, lastName: lead.lastName as string, specialty: lead.specialty as string, category: lead.category as string, phone: lead.phone as string, email: lead.email as string, linkedIn: lead.linkedIn as string, originCountry: lead.originCountry as string, yearsExperience: lead.yearsExperience as number, quality: lead.quality as string },
        pricePaid: price, purchaseId,
      });
    }
  } catch { /* noop */ }

  return NextResponse.json({
    success: true, pricePaid: price, creditsRemaining: balanceAfter, purchaseId, contactId,
    lead: { firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, email: lead.email, linkedIn: lead.linkedIn, notes: lead.notes, specialty: lead.specialty, category: lead.category, originCountry: lead.originCountry, yearsExperience: lead.yearsExperience },
  });
}
