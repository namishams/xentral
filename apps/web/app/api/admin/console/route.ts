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
async function q(p: Pool, sql: string, params: unknown[] = []) { try { return (await p.query(sql, params)).rows; } catch { return []; } }

/** Consolidated platform-operator console feed. SUPER_ADMIN (Xentral) only. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ ok: false });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = pool(url);

  const tenants = (await q(p, `select c.id, c.name, coalesce(c.credits,0)::int as credits, to_char(c."createdAt",'DD Mon YYYY') as joined,
      (select count(*)::int from users u where u."companyId"=c.id) as users,
      (select count(*)::int from contacts ct where ct."companyId"=c.id) as contacts,
      (select coalesce(sum(soldprice),0)::numeric from "marketplace_leads" ml where ml."soldToId"=c.id) as spent
    from companies c order by c."createdAt" asc`))
    .map((r) => ({ ...r, credits: N(r.credits), users: N(r.users), contacts: N(r.contacts), spent: N(r.spent) }));

  const leads = (await q(p, `select id, coalesce(nullif(title,''), specialty, 'Lead') as name, category, "originRegion" as origin, quality::text as quality,
      "initialPrice" as price, "minPrice" as floor, status::text as status, "purchaseCount" as buyers, "maxPurchases" as cap, listing_type as kind,
      to_char("listedAt",'DD Mon YYYY') as listed from "marketplace_leads" order by "createdAt" desc limit 500`))
    .map((r) => ({ ...r, price: N(r.price), floor: N(r.floor), buyers: N(r.buyers), cap: N(r.cap) || 1 }));

  const supply = {
    listed: leads.length,
    available: leads.filter((l) => l.status === "AVAILABLE" && l.buyers < l.cap).length,
    sold: leads.filter((l) => l.status === "SOLD").length,
    draft: leads.filter((l) => l.status === "DRAFT").length,
    gmv: leads.reduce((a, l) => a + (l.status === "SOLD" ? l.price : 0), 0),
  };

  const topups = (await q(p, `select t.id, t."companyId" as "companyId", c.name as company, coalesce(c.credits,0)::int as balance,
      t.amount, t.status::text as status, to_char(t."createdAt",'DD Mon YYYY') as date
    from "credit_topup_requests" t left join companies c on c.id=t."companyId" order by t."createdAt" desc limit 50`))
    .map((r) => ({ ...r, amount: N(r.amount), balance: N(r.balance) }));

  const demos = (await q(p, `select id, name, email, company, country, "useCase" as "useCase", status::text as status, to_char("createdAt",'DD Mon YYYY') as date
    from "demo_requests" order by "createdAt" desc limit 100`));

  const questions = (await q(p, `select lq.id, lq.question, lq.answer, lq.status::text as status, c.name as company, to_char(lq."createdAt",'DD Mon YYYY') as date
    from "lead_questions" lq left join companies c on c.id=lq."companyId" order by lq."createdAt" desc limit 100`));

  const resellers = (await q(p, `select rp.id, c.name as company, rp."isApproved" as approved, rp."commissionRate" as rate,
      coalesce(rp."totalEarned",0)::numeric as earned, coalesce(rp."pendingBalance",0)::numeric as pending, coalesce(rp."totalPaid",0)::numeric as paid
    from "reseller_profiles" rp left join companies c on c.id=rp."companyId" order by rp."createdAt" desc limit 100`))
    .map((r) => ({ ...r, rate: N(r.rate), earned: N(r.earned), pending: N(r.pending), paid: N(r.paid), approved: !!r.approved }));

  const payouts = (await q(p, `select po.id, c.name as company, po.amount, po.status::text as status, po.method, to_char(po."requestedAt",'DD Mon YYYY') as date
    from "reseller_payouts" po left join "reseller_profiles" rp on rp.id=po."resellerId" left join companies c on c.id=rp."companyId" order by po."requestedAt" desc limit 50`))
    .map((r) => ({ ...r, amount: N(r.amount) }));

  const subsRows = await q(p, `select status::text as status, count(*)::int as n from "subscriptions" group by status::text`);
  const subsActive = subsRows.filter((r) => ["ACTIVE", "TRIALING", "active", "trialing"].includes(String(r.status))).reduce((a, r) => a + N(r.n), 0);

  const totals = {
    tenants: tenants.length,
    users: tenants.reduce((a, t) => a + N(t.users), 0),
    credits: tenants.reduce((a, t) => a + N(t.credits), 0),
    subsActive,
    pendingTopups: topups.filter((t) => String(t.status).toLowerCase() === "pending").length,
    pendingDemos: demos.filter((d) => String(d.status).toLowerCase() === "pending" || String(d.status).toLowerCase() === "new").length,
    openQuestions: questions.filter((x) => String(x.status).toLowerCase() === "open").length,
    pendingPayouts: payouts.filter((x) => String(x.status).toLowerCase() === "pending").length,
  };
  const streams = { marketplaceGmv: supply.gmv, creditsOutstanding: totals.credits, subscriptions: subsActive };
  const topCustomers = [...tenants].sort((a, b) => b.spent - a.spent).slice(0, 5);

  return NextResponse.json({ ok: true, totals, streams, supply, tenants, leads, topups, demos, questions, resellers, payouts, topCustomers });
}
