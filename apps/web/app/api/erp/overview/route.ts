import "server-only";
import "../../../../lib/session";
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
const N = (v: unknown) => Number(v) || 0;
const CREDIT_NORMAL = ["liability", "equity", "income"];

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ empty: true });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  try {
    const rows = (await p.query(
      `select la.code, la.name, la.type::text as type, coalesce(sum(jl.debit),0) as debit, coalesce(sum(jl.credit),0) as credit
         from "ledger_accounts" la left join "journal_lines" jl on jl."accountId" = la.id
        where la."companyId" = $1 group by la.code, la.name, la.type
        order by la.type asc, la.code asc`, [cid])).rows;

    const accounts = rows.map((r) => {
      const debit = N(r.debit), credit = N(r.credit);
      const bal = CREDIT_NORMAL.includes(r.type) ? credit - debit : debit - credit;
      return { code: r.code || "", name: r.name || "", type: r.type, debit, credit, balance: bal };
    });
    const active = accounts.filter((a) => a.debit !== 0 || a.credit !== 0);
    const byTypeMap = new Map<string, number>();
    let totalDebit = 0, totalCredit = 0;
    for (const a of accounts) { byTypeMap.set(a.type, (byTypeMap.get(a.type) || 0) + a.balance); totalDebit += a.debit; totalCredit += a.credit; }
    const t = (k: string) => Math.round(byTypeMap.get(k) || 0);
    const assets = t("asset"), liabilities = t("liability"), equity = t("equity"), income = t("income"), expenses = t("expense");
    const netIncome = income - expenses;

    const inv = (await p.query(
      `select count(*)::int as cnt,
              count(*) filter (where "isSellable")::int as sellable,
              count(*) filter (where "isPurchasable")::int as purchasable,
              coalesce(sum("costPrice"),0) as costbasis
         from "inventory_items" where "companyId" = $1 and status::text = 'ACTIVE'`, [cid])).rows[0] || {};

    return NextResponse.json({
      currency: "AED",
      kpis: { assets, liabilities, equity, income, expenses, netIncome, invCount: N(inv.cnt), invSellable: N(inv.sellable) },
      balanced: Math.round(totalDebit) === Math.round(totalCredit),
      totalDebit: Math.round(totalDebit), totalCredit: Math.round(totalCredit),
      accounts: active.map((a) => ({ ...a, debit: Math.round(a.debit), credit: Math.round(a.credit), balance: Math.round(a.balance) })),
      inventory: { count: N(inv.cnt), sellable: N(inv.sellable), purchasable: N(inv.purchasable), costBasis: N(inv.costbasis) },
    });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}
