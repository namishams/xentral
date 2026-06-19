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
// probability weighting per quote status → expected revenue
const PROB: Record<string, number> = { DRAFT: 0.2, SENT: 0.5, ACCEPTED: 0.9, CONVERTED: 1, DECLINED: 0, EXPIRED: 0, CANCELLED: 0 };

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ empty: true });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  try {
    const quotes = (await p.query(
      `select status::text as status, count(*)::int as cnt, coalesce(sum(total),0) as total
         from "quotes" where "companyId" = $1 group by status`, [cid])).rows;
    const inv = (await p.query(
      `select coalesce(sum(case when "issueDate" >= date_trunc('quarter', now()) and status::text <> 'CANCELLED' then total else 0 end),0) as "qtrBilled",
              coalesce(sum("amountPaid"),0) as collected,
              coalesce(sum(case when status::text in ('SENT','PARTIALLY_PAID','OVERDUE') then (total - "amountPaid") else 0 end),0) as outstanding,
              coalesce(max(currency),'AED') as currency
         from "invoices" where "companyId" = $1`, [cid])).rows[0] || {};
    const trend = (await p.query(
      `select to_char(date_trunc('month', "issueDate"),'Mon') as label, date_trunc('month',"issueDate") as m,
              coalesce(sum(total),0) as total
         from "invoices" where "companyId" = $1 and status::text <> 'CANCELLED' and "issueDate" >= (date_trunc('month', now()) - interval '5 months')
        group by 1,2 order by 2 asc`, [cid])).rows;
    const top = (await p.query(
      `select bc.name as name, coalesce(sum(i.total),0) as billed
         from "invoices" i join "billing_customers" bc on bc.id = i."customerId"
        where i."companyId" = $1 and i.status::text <> 'CANCELLED'
        group by bc.name order by billed desc limit 6`, [cid])).rows;

    const byStatus = quotes.map((r) => {
      const prob = PROB[r.status] ?? 0.3;
      return { status: r.status, count: N(r.cnt), value: N(r.total), prob: Math.round(prob * 100), weighted: Math.round(N(r.total) * prob) };
    }).sort((a, b) => b.weighted - a.weighted);
    const openPipeline = byStatus.filter((r) => ["DRAFT", "SENT"].includes(r.status)).reduce((s, r) => s + r.value, 0);
    const weightedForecast = byStatus.filter((r) => !["DECLINED", "EXPIRED", "CANCELLED"].includes(r.status)).reduce((s, r) => s + r.weighted, 0);
    const sent = byStatus.find((r) => r.status === "SENT")?.count || 0;
    const accepted = (byStatus.find((r) => r.status === "ACCEPTED")?.count || 0) + (byStatus.find((r) => r.status === "CONVERTED")?.count || 0);
    const declined = byStatus.find((r) => r.status === "DECLINED")?.count || 0;
    const decided = accepted + declined;
    const winRate = decided > 0 ? Math.round((accepted / decided) * 100) : 0;

    return NextResponse.json({
      currency: inv.currency || "AED",
      kpis: { openPipeline, weightedForecast, winRate, qtrBilled: N(inv.qtrBilled), collected: N(inv.collected), outstanding: N(inv.outstanding), openQuotes: sent + (byStatus.find((r) => r.status === "DRAFT")?.count || 0) },
      byStatus,
      trend: trend.map((r) => ({ label: r.label, total: N(r.total) })),
      top: top.map((r) => ({ name: r.name || "—", billed: N(r.billed) })),
    });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}
