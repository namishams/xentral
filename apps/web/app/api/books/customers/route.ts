import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver into the shared app kernel instance
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

/** Billing customers for the customer picker. Empty on the dormant preview. */
export async function GET(req: Request) {
  const wantStats = new URL(req.url).searchParams.get("stats") === "1";

  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ rows: [] });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (wantStats) {
      const { rows } = await pool(url).query(
        `select c.id, c.name, c.email, count(i.id)::int as "invoiceCount",
                coalesce(sum(case when i.status::text in ('SENT','PARTIALLY_PAID','OVERDUE') then (i.total - i."amountPaid") else 0 end),0) as outstanding,
                coalesce(sum(case when i.status::text <> 'CANCELLED' then i.total else 0 end),0) as billed,
                coalesce(sum(i."amountPaid"),0) as paid,
                coalesce(max(i.currency),'AED') as currency
           from "billing_customers" c left join "invoices" i on i.id is not null and i."customerId" = c.id and i."companyId" = $1
          where c."companyId" = $1 group by c.id, c.name, c.email order by outstanding desc, c.name asc limit 1000`, [session.companyId]);
      return NextResponse.json({ rows: rows.map((r) => ({ ...r, outstanding: Number(r.outstanding) || 0, billed: Number(r.billed) || 0, paid: Number(r.paid) || 0 })) });
    }
    const { rows } = await pool(url).query(
      `select id, name, email from "billing_customers" where "companyId" = $1 order by name asc limit 1000`, [session.companyId]);
    return NextResponse.json({ rows });
  } catch { return NextResponse.json({ rows: [] }); }
}

// Tax treatments that legally require a Tax Registration Number (TRN).
const TRN_REQUIRED = ["vat_registered", "gcc_vat_registered", "designated_zone"];

/** Create a billing customer (Zoho-style: customer type, tax treatment, place of supply, addresses). */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const s = (k: string) => { const v = b[k]; return v == null ? null : String(v).trim() || null; };
  const customerType = s("customerType") === "individual" ? "individual" : "business";
  const firstName = s("firstName"); const lastName = s("lastName"); const companyName = s("companyName");
  const display = s("displayName") || companyName || [firstName, lastName].filter(Boolean).join(" ") || s("name");
  if (!display) return NextResponse.json({ error: "Display name (or company / contact name) is required" }, { status: 400 });

  const taxTreatment = s("taxTreatment");
  const trn = s("vatNumber");
  if (taxTreatment && TRN_REQUIRED.includes(taxTreatment)) {
    if (!trn) return NextResponse.json({ error: "TRN is required for this tax treatment." }, { status: 400 });
    if (!/^\d{15}$/.test(trn)) return NextResponse.json({ error: "TRN must be exactly 15 digits." }, { status: 400 });
  } else if (trn && !/^\d{15}$/.test(trn)) {
    return NextResponse.json({ error: "TRN must be exactly 15 digits." }, { status: 400 });
  }

  const id = randomUUID();
  try {
    await pool(url).query(
      `insert into "billing_customers"
         (id,"companyId",name,"displayName","customerType",salutation,"firstName","lastName","companyName","legalName",
          email,phone,mobile,"vatNumber","taxTreatment","placeOfSupply",currency,"paymentTerms","priceListId",
          "addressLine1","addressLine2",city,country,"shipAddressLine1","shipAddressLine2","shipCity","shipCountry",
          "portalEnabled",notes,"createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,now(),now())`,
      [id, session.companyId, display, display, customerType, s("salutation"), firstName, lastName, companyName, s("legalName"),
        s("email"), s("phone"), s("mobile"), trn, taxTreatment, s("placeOfSupply"), s("currency") || "AED", s("paymentTerms") || "due_on_receipt", s("priceListId"),
        s("addressLine1"), s("addressLine2"), s("city"), s("country") || "United Arab Emirates", s("shipAddressLine1"), s("shipAddressLine2"), s("shipCity"), s("shipCountry"),
        b.portalEnabled === true, s("notes")]);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Create failed" }, { status: 500 });
  }
}
