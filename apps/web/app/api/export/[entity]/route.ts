import "server-only";
import "../../../../lib/session";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveSession } from "@xentral/kernel";
import { buildXlsx } from "../../../../lib/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _pool: Pool | null = null;
function pool(url: string): Pool {
  if (_pool) return _pool;
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+):(\d+)\/([^?]+)/);
  _pool = m ? new Pool({ user: m[1], password: m[2], host: m[3], port: Number(m[4]), database: m[5], max: 4 }) : new Pool({ connectionString: url, max: 4 });
  return _pool;
}

type Spec = { filename: string; headers: string[]; sql: string };

/** Each SQL aliases its columns to exactly match `headers`, so the CSV writer
 * is generic. All queries are tenant-scoped on $1 = companyId. */
const SPECS: Record<string, Spec> = {
  items: { filename: "items", headers: ["Name", "SKU", "Category", "Type", "Unit Price", "VAT %", "Recurring", "Active"],
    sql: `select name as "Name", coalesce(sku,'') as "SKU", coalesce(category,'') as "Category", kind::text as "Type", "unitPrice" as "Unit Price", "vatRate" as "VAT %", case when coalesce(recurring,false) then 'Yes' else 'No' end as "Recurring", case when "isActive" then 'Active' else 'Inactive' end as "Active" from "catalog_items" where "companyId"=$1 order by name asc limit 5000` },
  customers: { filename: "customers", headers: ["Name", "Email", "Invoices", "Billed", "Paid", "Outstanding", "Currency"],
    sql: `select c.name as "Name", coalesce(c.email,'') as "Email", count(i.id)::int as "Invoices", coalesce(sum(case when i.status::text<>'CANCELLED' then i.total else 0 end),0) as "Billed", coalesce(sum(i."amountPaid"),0) as "Paid", coalesce(sum(case when i.status::text in ('SENT','PARTIALLY_PAID','OVERDUE') then (i.total-i."amountPaid") else 0 end),0) as "Outstanding", coalesce(max(i.currency),'AED') as "Currency" from "billing_customers" c left join "invoices" i on i."customerId"=c.id and i."companyId"=$1 where c."companyId"=$1 group by c.id,c.name,c.email order by c.name asc limit 5000` },
  contacts: { filename: "contacts", headers: ["Name", "Email"],
    sql: `select (coalesce("firstName",'')||' '||coalesce("lastName",'')) as "Name", coalesce(email,'') as "Email" from "contacts" where "companyId"=$1 and coalesce("isArchived",false)=false order by "updatedAt" desc limit 5000` },
  invoices: { filename: "invoices", headers: ["Number", "Customer", "Status", "Total", "Paid", "Currency", "Issued", "Due"],
    sql: `select i.number as "Number", coalesce(bc.name,'') as "Customer", i.status::text as "Status", i.total as "Total", i."amountPaid" as "Paid", i.currency as "Currency", to_char(i."issueDate",'YYYY-MM-DD') as "Issued", to_char(i."dueDate",'YYYY-MM-DD') as "Due" from "invoices" i left join "billing_customers" bc on bc.id=i."customerId" where i."companyId"=$1 order by i."createdAt" desc limit 5000` },
  quotes: { filename: "quotes", headers: ["Number", "Customer", "Status", "Total", "Currency", "Issued", "Valid until"],
    sql: `select q.number as "Number", coalesce(bc.name,'') as "Customer", q.status::text as "Status", q.total as "Total", q.currency as "Currency", to_char(q."issueDate",'YYYY-MM-DD') as "Issued", to_char(q."validUntil",'YYYY-MM-DD') as "Valid until" from "quotes" q left join "billing_customers" bc on bc.id=q."customerId" where q."companyId"=$1 order by q."createdAt" desc limit 5000` },
};

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request, { params }: { params: { entity: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const spec = SPECS[params.entity];
  if (!spec) return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  try {
    const { rows } = await pool(url).query(spec.sql, [session.companyId]);
    const date2 = new Date().toISOString().slice(0, 10);
    if (new URL(req.url).searchParams.get("format") === "xlsx") {
      const buf = buildXlsx(spec.filename, spec.headers, rows as Record<string, unknown>[]);
      return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${spec.filename}-${date2}.xlsx"` } });
    }
    const lines = [spec.headers.map(csvCell).join(",")];
    for (const r of rows) lines.push(spec.headers.map((h) => csvCell((r as Record<string, unknown>)[h])).join(","));
    const csv = "﻿" + lines.join("\r\n");
    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${spec.filename}-${date}.csv"` } });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Export failed" }, { status: 500 }); }
}
