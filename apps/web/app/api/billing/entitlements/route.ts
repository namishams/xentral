import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { logAudit } from "../../../../lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}
const N = (v: unknown) => Number(v) || 0;
const PLAN_COLS = `key, name, description, "priceMonthly", "priceAnnual", "seatPriceMonthly", "seatsIncluded", "aiCredits", "automationLimit", "campaignLimit", "marketplaceAccess", "apiAccess", integrations, "storageMb", "sortOrder"`;

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ empty: true });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  try {
    const plans = (await p.query(`select ${PLAN_COLS} from "plans" where "isActive" = true order by "sortOrder" asc`)).rows;
    const sub = (await p.query(`select "planKey", status, "billingCycle", "seatsPurchased", "creditsBalance", to_char("currentPeriodEnd",'DD Mon YYYY') as "renewsOn", to_char("trialEndsAt",'DD Mon YYYY') as "trialEnds" from "subscriptions" where "companyId" = $1 order by "createdAt" desc limit 1`, [cid])).rows[0] || null;
    const planKey = sub?.planKey || "starter";
    const plan = plans.find((p2) => p2.key === planKey) || plans[0] || null;
    const seatsUsed = N((await p.query(`select count(*)::int as n from "users" where "companyId" = $1 and "isActive" = true`, [cid])).rows[0]?.n);
    let automationsUsed = 0;
    try { automationsUsed = N((await p.query(`select count(*)::int as n from "automations" where "companyId" = $1`, [cid])).rows[0]?.n); } catch { automationsUsed = 0; }
    const seatsCap = N(plan?.seatsIncluded) + N(sub?.seatsPurchased);

    return NextResponse.json({
      currency: "AED",
      plan, plans,
      subscription: { planKey, status: sub?.status || "none", billingCycle: sub?.billingCycle || "monthly", renewsOn: sub?.renewsOn || null, trialEnds: sub?.trialEnds || null },
      usage: {
        seatsUsed, seatsCap: seatsCap || N(plan?.seatsIncluded),
        aiCreditsBalance: N(sub?.creditsBalance), aiCreditsIncluded: N(plan?.aiCredits),
        automationsUsed, automationsCap: N(plan?.automationLimit),
      },
    });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}

/** PATCH — switch the workspace plan (records the change; paid tiers settle via Telr at renewal). */
export async function PATCH(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && session.role !== "OWNER") return NextResponse.json({ error: "Only an admin can change the plan." }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const planKey = String(b.planKey ?? "").trim();
  const cycle = b.billingCycle === "annual" ? "annual" : "monthly";
  if (!planKey) return NextResponse.json({ error: "planKey required" }, { status: 400 });
  const cid = session.companyId; const p = pool(url);
  try {
    const exists = (await p.query(`select key from "plans" where key = $1 and "isActive" = true`, [planKey])).rowCount;
    if (!exists) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    const cur = (await p.query(`select id from "subscriptions" where "companyId" = $1 order by "createdAt" desc limit 1`, [cid])).rows[0];
    if (cur) await p.query(`update "subscriptions" set "planKey" = $1, "billingCycle" = $2, status = 'active', "updatedAt" = now() where id = $3`, [planKey, cycle, cur.id]);
    else await p.query(`insert into "subscriptions" (id,"companyId","planKey","billingCycle",status,"createdAt","updatedAt") values (gen_random_uuid()::text,$1,$2,$3,'active',now(),now())`, [cid, planKey, cycle]);
    await p.query(`update "companies" set plan = $1, "updatedAt" = now() where id = $2`, [planKey, cid]).catch(() => {});
    await logAudit("billing.plan.change", { targetType: "subscription", meta: { planKey, billingCycle: cycle } });
    return NextResponse.json({ ok: true, planKey });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Failed" }, { status: 500 }); }
}
