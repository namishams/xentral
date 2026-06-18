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
const newId = () => "ql" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "INVOICED"];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = pool(url);
    const q = await p.query(
      `select q.id, q.number, q.status::text as status, q.total, q.subtotal, q."vatTotal" as "vatTotal", q.currency,
              to_char(q."issueDate",'DD Mon YYYY') as issued, to_char(q."validUntil",'DD Mon YYYY') as valid, to_char(q."validUntil",'YYYY-MM-DD') as "validRaw", q.notes, q."publicToken" as token,
              q."invoiceId" as "invoiceId", q."sentAt" as "sentAt", q."invoiceId" is not null as converted,
              to_char(q."issueDate",'YYYY-MM-DD') as "issueDateRaw", q."referenceNo" as "referenceNo", q."projectName" as "projectName", q."salespersonId" as "salespersonId", q."customerId" as "customerId",
              bc.name as customer, bc.email as "customerEmail",
              inv.number as "invoiceNumber"
         from "quotes" q left join "billing_customers" bc on bc.id = q."customerId"
              left join "invoices" inv on inv.id = q."invoiceId"
        where q.id = $1 and q."companyId" = $2 limit 1`, [params.id, session.companyId]);
    if (!q.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lines = await p.query(`select name, description, qty, "unitPrice" as "unitPrice", "vatRate" as "vatRate", "discountPct" as "discountPct", "lineTotal" as "lineTotal" from "quote_lines" where "quoteId" = $1 order by position asc`, [params.id]);
    return NextResponse.json({ quote: q.rows[0], lines: lines.rows });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const hasLines = Array.isArray(b.lines);

  const client = await pool(url).connect();
  try {
    await client.query("begin");
    const own = await client.query(`select id from "quotes" where id = $1 and "companyId" = $2 for update`, [params.id, session.companyId]);
    if (!own.rows[0]) { await client.query("rollback"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }

    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    if (typeof b.status === "string" && STATUSES.includes(b.status)) { sets.push(`status = $${i}::"QuoteStatus"`); vals.push(b.status); i++; }
    if ("validUntil" in b) { sets.push(`"validUntil" = $${i}::timestamptz`); vals.push(b.validUntil ? String(b.validUntil) : null); i++; }
    if ("issueDate" in b) { sets.push(`"issueDate" = $${i}::timestamptz`); vals.push(b.issueDate ? String(b.issueDate) : null); i++; }
    if ("notes" in b) { sets.push(`notes = $${i}`); vals.push(b.notes == null ? null : String(b.notes)); i++; }
    if ("referenceNo" in b) { sets.push(`"referenceNo" = $${i}`); vals.push(b.referenceNo == null || String(b.referenceNo).trim() === "" ? null : String(b.referenceNo)); i++; }
    if ("projectName" in b) { sets.push(`"projectName" = $${i}`); vals.push(b.projectName == null || String(b.projectName).trim() === "" ? null : String(b.projectName)); i++; }
    if ("salespersonId" in b) { sets.push(`"salespersonId" = $${i}`); vals.push(b.salespersonId ? String(b.salespersonId) : null); i++; }
    if ("currency" in b && b.currency) { sets.push(`currency = $${i}`); vals.push(String(b.currency)); i++; }
    if ("customerId" in b && b.customerId) {
      const own2 = await client.query(`select id from "billing_customers" where id=$1 and "companyId"=$2 limit 1`, [String(b.customerId), session.companyId]);
      if (own2.rows[0]) { sets.push(`"customerId" = $${i}`); vals.push(String(b.customerId)); i++; }
    }

    if (hasLines) {
      const raw = (b.lines as Record<string, unknown>[]).filter((l) => String(l.name ?? "").trim() || Number(l.unitPrice) > 0);
      let subtotal = 0, vatTotal = 0;
      const norm = raw.map((l, idx) => {
        const qty = Number(l.qty) || 0, up = Number(l.unitPrice) || 0, disc = Number(l.discountPct) || 0;
        const vat = l.vatRate == null ? 5 : Number(l.vatRate);
        const net = qty * up * (1 - disc / 100); subtotal += net; vatTotal += net * vat / 100;
        return { pos: idx, name: String(l.name ?? "Item") || "Item", description: l.description ? String(l.description) : null, qty, up, vat, disc, net };
      });
      const total = subtotal + vatTotal;
      sets.push(`subtotal = $${i}`); vals.push(subtotal.toFixed(2)); i++;
      sets.push(`"vatTotal" = $${i}`); vals.push(vatTotal.toFixed(2)); i++;
      sets.push(`total = $${i}`); vals.push(total.toFixed(2)); i++;
      sets.push(`"updatedAt" = now()`);
      vals.push(params.id, session.companyId);
      await client.query(`update "quotes" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
      await client.query(`delete from "quote_lines" where "quoteId" = $1`, [params.id]);
      for (const l of norm) {
        await client.query(`insert into "quote_lines" (id,"quoteId",position,name,description,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [newId(), params.id, l.pos, l.name, l.description, l.qty, l.up, l.vat, l.disc, l.net.toFixed(2)]);
      }
    } else {
      if (sets.length === 0) { await client.query("rollback"); return NextResponse.json({ error: "No editable fields" }, { status: 400 }); }
      sets.push(`"updatedAt" = now()`);
      vals.push(params.id, session.companyId);
      await client.query(`update "quotes" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
    }
    await client.query("commit");
    return NextResponse.json({ ok: true });
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally { client.release(); }
}

/** Delete a DRAFT quote (and its lines). Sent/accepted quotes are protected. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = await pool(url).connect();
  try {
    await client.query("begin");
    const own = await client.query(`select status::text as status, "invoiceId" from "quotes" where id = $1 and "companyId" = $2 for update`, [params.id, session.companyId]);
    if (!own.rows[0]) { await client.query("rollback"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
    if (own.rows[0].invoiceId) { await client.query("rollback"); return NextResponse.json({ error: "This quote is linked to an invoice and can't be deleted." }, { status: 409 }); }
    if (own.rows[0].status !== "DRAFT") { await client.query("rollback"); return NextResponse.json({ error: "Only draft quotes can be deleted." }, { status: 409 }); }
    await client.query(`delete from "quote_lines" where "quoteId" = $1`, [params.id]);
    await client.query(`delete from "document_attachments" where "companyId" = $1 and "docType" = 'QUOTE' and "docId" = $2`, [session.companyId, params.id]);
    await client.query(`delete from "quotes" where id = $1 and "companyId" = $2`, [params.id, session.companyId]);
    await client.query("commit");
    return NextResponse.json({ ok: true });
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  } finally { client.release(); }
}
