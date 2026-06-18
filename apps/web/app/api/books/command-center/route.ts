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
const N = (v: unknown) => Number(v ?? 0);
const DAY = 86400000;

type Inv = { id: string; number: string; status: string; total: unknown; amountPaid: unknown; vatTotal: unknown; issueDate: string | null; dueDate: string | null; paidAt: string | null; currency: string; customer: string | null };
type Q = { id: string; number: string; status: string; total: unknown; validUntil: string | null; customer: string | null };

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ empty: true });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  let inv: Inv[] = [], qs: Q[] = [], currency = "AED";
  try {
    inv = (await p.query(`select i.id, i.number, i.status::text as status, i.total, i."amountPaid" as "amountPaid", i."vatTotal" as "vatTotal", i."issueDate" as "issueDate", i."dueDate" as "dueDate", i."paidAt" as "paidAt", i.currency, bc.name as customer from "invoices" i left join "billing_customers" bc on bc.id = i."customerId" where i."companyId" = $1`, [cid])).rows as Inv[];
    qs = (await p.query(`select q.id, q.number, q.status::text as status, q.total, q."validUntil" as "validUntil", bc.name as customer from "quotes" q left join "billing_customers" bc on bc.id = q."customerId" where q."companyId" = $1`, [cid])).rows as Q[];
    currency = (await p.query(`select currency from "billing_settings" where "companyId" = $1`, [cid])).rows[0]?.currency || "AED";
  } catch { /* empty */ }

  const out = (i: Inv) => N(i.total) - N(i.amountPaid);
  const unpaid = inv.filter((i) => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(i.status));
  const overdue = unpaid.filter((i) => i.dueDate && new Date(i.dueDate) < now);
  const ar = unpaid.reduce((s, i) => s + out(i), 0);
  const overdueAmt = overdue.reduce((s, i) => s + out(i), 0);
  const collected = inv.filter((i) => i.paidAt && new Date(i.paidAt) >= monthStart).reduce((s, i) => s + N(i.amountPaid), 0);
  const revenueAll = inv.reduce((s, i) => s + N(i.amountPaid), 0);
  const vatQuarter = inv.filter((i) => i.paidAt && new Date(i.paidAt) >= quarterStart).reduce((s, i) => s + N(i.vatTotal), 0);
  const pendingQuotes = qs.filter((q) => ["SENT", "VIEWED"].includes(q.status));
  const pendingQuotesVal = pendingQuotes.reduce((s, q) => s + N(q.total), 0);
  const draftInvoices = inv.filter((i) => i.status === "DRAFT").length;

  const bucketDefs = [
    { label: "Current", test: (d: number) => d <= 0 },
    { label: "1–30", test: (d: number) => d >= 1 && d <= 30 },
    { label: "31–60", test: (d: number) => d >= 31 && d <= 60 },
    { label: "61–90", test: (d: number) => d >= 61 && d <= 90 },
    { label: "90+", test: (d: number) => d > 90 },
  ];
  const aging = bucketDefs.map((b) => {
    const rows = unpaid.filter((i) => { const past = i.dueDate ? Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / DAY) : 0; return b.test(past); });
    return { label: b.label, amount: rows.reduce((s, i) => s + out(i), 0), count: rows.length };
  });

  const trend: { label: string; value: number }[] = [];
  for (let m = 5; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
    const val = inv.filter((i) => i.paidAt && new Date(i.paidAt) >= start && new Date(i.paidAt) < end).reduce((s, i) => s + N(i.amountPaid), 0);
    trend.push({ label: start.toLocaleDateString("en-GB", { month: "short" }), value: val });
  }

  const byCust = new Map<string, { name: string; amount: number; count: number; oldest: number }>();
  for (const i of unpaid) {
    const name = i.customer ?? "—";
    const e = byCust.get(name) ?? { name, amount: 0, count: 0, oldest: 0 };
    e.amount += out(i); e.count++;
    const past = i.dueDate ? Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / DAY) : 0;
    e.oldest = Math.max(e.oldest, past);
    byCust.set(name, e);
  }
  const debtors = Array.from(byCust.values()).sort((a, b) => b.amount - a.amount).slice(0, 6);

  const fd = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—");
  const recentInvoices = inv.slice().sort((a, b) => new Date(b.issueDate || 0).getTime() - new Date(a.issueDate || 0).getTime()).slice(0, 6)
    .map((i) => ({ id: i.id, number: i.number, customer: i.customer ?? "—", status: i.status, total: N(i.total), balance: out(i), due: fd(i.dueDate) }));
  const recentQuotes = qs.slice(0, 6).map((q) => ({ id: q.id, number: q.number, customer: q.customer ?? "—", status: q.status, total: N(q.total), valid: fd(q.validUntil) }));

  return NextResponse.json({
    currency,
    kpis: { ar, overdueAmt, overdueCount: overdue.length, collected, revenueAll, vatQuarter, pendingQuotesVal, pendingQuotesCount: pendingQuotes.length, draftInvoices, invoiceCount: inv.length },
    aging, trend, debtors, recentInvoices, recentQuotes,
  });
}
