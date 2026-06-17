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
const newId = () => "il" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = pool(url);
    const inv = await p.query(
      `select i.id, i.number, i.status::text as status, i.total, i."amountPaid" as "amountPaid", i.subtotal, i."vatTotal" as "vatTotal", i.currency,
              to_char(i."issueDate",'DD Mon YYYY') as issued, to_char(i."dueDate",'YYYY-MM-DD') as "dueDateRaw", to_char(i."dueDate",'DD Mon YYYY') as due, i.notes,
              bc.name as customer, bc.email as "customerEmail"
         from "invoices" i left join "billing_customers" bc on bc.id = i."customerId"
        where i.id = $1 and i."companyId" = $2 limit 1`, [params.id, session.companyId]);
    if (!inv.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lines = await p.query(`select name, description, qty, "unitPrice" as "unitPrice", "vatRate" as "vatRate", "discountPct" as "discountPct", "lineTotal" as "lineTotal" from "invoice_lines" where "invoiceId" = $1 order by position asc`, [params.id]);
    return NextResponse.json({ invoice: inv.rows[0], lines: lines.rows });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

/** Edit invoice. Header fields (status/dueDate/notes) and/or full line-item replace (lines[]). */
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
    const own = await client.query(`select id from "invoices" where id = $1 and "companyId" = $2 for update`, [params.id, session.companyId]);
    if (!own.rows[0]) { await client.query("rollback"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }

    const sets: string[] = []; const vals: unknown[] = []; let i = 1;
    if (typeof b.status === "string" && STATUSES.includes(b.status)) { sets.push(`status = $${i}::"InvoiceStatus"`); vals.push(b.status); i++; }
    if ("dueDate" in b) { sets.push(`"dueDate" = $${i}::timestamptz`); vals.push(b.dueDate ? String(b.dueDate) : null); i++; }
    if ("notes" in b) { sets.push(`notes = $${i}`); vals.push(b.notes == null ? null : String(b.notes)); i++; }

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
      await client.query(`update "invoices" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
      await client.query(`delete from "invoice_lines" where "invoiceId" = $1`, [params.id]);
      for (const l of norm) {
        await client.query(`insert into "invoice_lines" (id,"invoiceId",position,name,description,qty,"unitPrice","vatRate","discountPct","lineTotal") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [newId(), params.id, l.pos, l.name, l.description, l.qty, l.up, l.vat, l.disc, l.net.toFixed(2)]);
      }
    } else {
      if (sets.length === 0) { await client.query("rollback"); return NextResponse.json({ error: "No editable fields" }, { status: 400 }); }
      sets.push(`"updatedAt" = now()`);
      vals.push(params.id, session.companyId);
      await client.query(`update "invoices" set ${sets.join(", ")} where id = $${i} and "companyId" = $${i + 1}`, vals);
    }
    await client.query("commit");
    return NextResponse.json({ ok: true });
  } catch {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally { client.release(); }
}
