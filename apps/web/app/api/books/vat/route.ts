import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
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

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ empty: true });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const p = pool(url);

  const now = new Date();
  const q = Math.floor(now.getUTCMonth() / 3);
  const qStart = new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1));
  const qEnd = new Date(Date.UTC(now.getUTCFullYear(), q * 3 + 3, 1));
  const yStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const due = new Date(qEnd); due.setUTCDate(due.getUTCDate() + 28);
  const qLabel = `Q${q + 1} ${now.getUTCFullYear()}`;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

  try {
    const set = (await p.query(`select "vatNumber" from "billing_settings" where "companyId"=$1 limit 1`, [cid])).rows[0] || {};

    const outQ = (await p.query(
      `select coalesce(sum("vatTotal"),0) as vat, coalesce(sum(subtotal),0) as net, count(*)::int as cnt
         from "invoices" where "companyId"=$1 and status::text in ('SENT','PARTIALLY_PAID','PAID','OVERDUE')
          and "issueDate" >= $2 and "issueDate" < $3`, [cid, qStart, qEnd])).rows[0];
    const outYTD = (await p.query(
      `select coalesce(sum("vatTotal"),0) as vat from "invoices" where "companyId"=$1 and status::text in ('SENT','PARTIALLY_PAID','PAID','OVERDUE') and "issueDate" >= $2`, [cid, yStart])).rows[0];
    const inQ = (await p.query(
      `select coalesce(sum("vatTotal"),0) as vat, coalesce(sum(subtotal),0) as net, count(*)::int as cnt
         from "bills" where "companyId"=$1 and status::text <> 'CANCELLED' and "billDate" >= $2 and "billDate" < $3`, [cid, qStart, qEnd])).rows[0];

    const outRows = (await p.query(
      `select i.id, i.number as doc, bc.name as party, i.subtotal as net, i."vatTotal" as vat, 'output' as type, to_char(i."issueDate",'DD Mon YYYY') as date, i."issueDate" as raw
         from "invoices" i left join "billing_customers" bc on bc.id = i."customerId"
        where i."companyId"=$1 and i.status::text in ('SENT','PARTIALLY_PAID','PAID','OVERDUE') and i."issueDate" >= $2 and i."issueDate" < $3
        order by i."issueDate" desc limit 15`, [cid, qStart, qEnd])).rows;
    const inRows = (await p.query(
      `select b.id, b.number as doc, coalesce(b."supplierRef", 'Supplier') as party, b.subtotal as net, b."vatTotal" as vat, 'input' as type, to_char(b."billDate",'DD Mon YYYY') as date, b."billDate" as raw
         from "bills" b where b."companyId"=$1 and b.status::text <> 'CANCELLED' and b."billDate" >= $2 and b."billDate" < $3
        order by b."billDate" desc limit 15`, [cid, qStart, qEnd])).rows;

    const rows = [...outRows, ...inRows]
      .map((r) => ({ id: r.id, doc: r.doc, party: r.party || "—", net: N(r.net), vat: N(r.vat), type: r.type, date: r.date, raw: r.raw }))
      .sort((a, b) => new Date(b.raw).getTime() - new Date(a.raw).getTime())
      .slice(0, 20);

    const outputVat = N(outQ.vat), inputVat = N(inQ.vat);
    return NextResponse.json({
      currency: "AED",
      trn: set.vatNumber || null,
      period: { label: qLabel, start: fmt(qStart), end: fmt(new Date(qEnd.getTime() - 86400000)), due: fmt(due) },
      kpis: {
        outputVat, outputNet: N(outQ.net), outputCount: N(outQ.cnt),
        inputVat, inputNet: N(inQ.net), inputCount: N(inQ.cnt),
        netPayable: outputVat - inputVat,
        outputYTD: N(outYTD.vat),
      },
      rows,
    });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}
