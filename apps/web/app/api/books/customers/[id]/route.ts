import "server-only";
import "../../../../../lib/session";
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
const TEXT = ["name", "displayName", "legalName", "email", "phone", "mobile", "addressLine1", "addressLine2", "city", "country", "vatNumber", "notes", "accountId", "customerType", "salutation", "firstName", "lastName", "companyName", "taxTreatment", "placeOfSupply", "currency", "paymentTerms", "shipAddressLine1", "shipAddressLine2", "shipCity", "shipCountry"] as const;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const id = params.id; const p = pool(url);
  try {
    const c = await p.query(
      `select id, name, "legalName" as "legalName", email, phone, "addressLine1" as "addressLine1", "addressLine2" as "addressLine2", city, country, "vatNumber" as "vatNumber", notes, "contactId" as "contactId", "accountId" as "accountId"
         from "billing_customers" where id = $1 and "companyId" = $2 limit 1`, [id, cid]);
    if (!c.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const inv = (await p.query(`select id, number, status::text as status, total, "amountPaid" as "amountPaid", currency, to_char("issueDate",'DD Mon YYYY') as issued, to_char("dueDate",'DD Mon YYYY') as due from "invoices" where "companyId"=$1 and "customerId"=$2 order by "createdAt" desc limit 50`, [cid, id])).rows;
    const quotes = (await p.query(`select id, number, status::text as status, total, currency, to_char("validUntil",'DD Mon YYYY') as valid from "quotes" where "companyId"=$1 and "customerId"=$2 order by "createdAt" desc limit 50`, [cid, id])).rows;
    const pays = (await p.query(`select pr.id, pr.amount, pr.method, to_char(pr."paidAt",'DD Mon YYYY') as date, i.number as "invoiceNo" from "payment_records" pr join "invoices" i on i.id = pr."invoiceId" where i."companyId"=$1 and i."customerId"=$2 order by pr."paidAt" desc limit 20`, [cid, id])).rows;

    const billed = inv.reduce((s, r) => s + N(r.total), 0);
    const paid = inv.reduce((s, r) => s + N(r.amountPaid), 0);
    const outstanding = inv.filter((r) => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(String(r.status))).reduce((s, r) => s + (N(r.total) - N(r.amountPaid)), 0);

    return NextResponse.json({
      customer: c.rows[0],
      summary: { billed, paid, outstanding, invoiceCount: inv.length, quoteCount: quotes.length, currency: inv[0]?.currency || quotes[0]?.currency || "AED" },
      invoices: inv, quotes, payments: pays,
    });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cid = session.companyId; const id = params.id; const p = pool(url);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  if (typeof b.vatNumber === "string" && b.vatNumber && !/^\d{15}$/.test(b.vatNumber)) return NextResponse.json({ error: "TRN must be exactly 15 digits." }, { status: 400 });
  const sets: string[] = []; const vals: unknown[] = []; let i = 1;
  for (const f of TEXT) if (f in b) {
    if (f === "name" && !String(b[f] ?? "").trim()) continue;
    sets.push(`"${f}" = $${i}`); vals.push(b[f] == null ? null : String(b[f])); i++;
  }
  if (!sets.length) return NextResponse.json({ error: "No editable fields" }, { status: 400 });
  sets.push(`"updatedAt" = now()`); vals.push(id, cid);
  try {
    const r = await p.query(`update "billing_customers" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
    if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: (e as Error).message || "Update failed" }, { status: 500 }); }
}
