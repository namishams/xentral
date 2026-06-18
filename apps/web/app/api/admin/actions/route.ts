import "server-only";
import "../../../../lib/session"; // side-effect: register SessionPort resolver
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
const newId = (pf: string) => pf + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const S = (v: unknown) => (v == null ? "" : String(v));
const Nn = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

async function adjustCredits(p: Pool, companyId: string, delta: number, type: string, desc: string) {
  const cur = (await p.query(`select coalesce(credits,0)::numeric as c from companies where id=$1`, [companyId])).rows[0];
  const before = Nn(cur?.c);
  const after = Math.max(0, before + delta);
  await p.query(`update companies set credits=$1 where id=$2`, [Math.round(after), companyId]);
  try {
    await p.query(`insert into "credit_transactions" (id,"companyId",amount,type,description,"balanceBefore","balanceAfter","createdAt") values ($1,$2,$3,$4,$5,$6,$7,now())`,
      [newId("ctx"), companyId, Math.round(delta), type, desc, Math.round(before), Math.round(after)]);
  } catch { /* ledger best-effort */ }
  return after;
}

/** Operator write actions. SUPER_ADMIN (Xentral) only. */
export async function POST(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const kind = S(b.kind);
  const p = pool(url);
  try {
    if (kind === "mkt.add") {
      const id = newId("mkl");
      const region = S(b.originRegion) || "Unknown";
      const lt = S(b.listingType) || "shared";
      const exclusive = lt === "exclusive" || !!b.isExclusive;
      const cap = exclusive ? 1 : Math.max(1, Nn(b.maxPurchases) || 3);
      const years = b.yearsExperience != null && S(b.yearsExperience) !== "" ? Nn(b.yearsExperience) : null;
      const bidsClose = S(b.bidsCloseAt) ? new Date(S(b.bidsCloseAt)) : null;
      await p.query(
        `insert into "marketplace_leads" (id, title, specialty, category, "originCountry", "originRegion", quality, "yearsExperience", "currentLocation", summary,
            "hasPhone","hasWhatsApp","hasEmail","hasLinkedIn","hasCV","hasDataflow",
            "firstName","lastName",phone,email,"linkedIn",notes,"cvUrl",
            "initialPrice","minPrice","decayAmount","decayInterval","isExclusive","maxPurchases","purchaseCount",
            listing_type, min_bid, reserve_price, bids_close_at, status, "listedAt","createdAt","updatedAt","companyId")
         values ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9, $10,$11,$12,$13,$14,$15, $16,$17,$18,$19,$20,$21,$22,
            $23,$24,$25,$26,$27,$28,0, $29,$30,$31,$32,$33, now(),now(),now(),$34)`,
        [id, S(b.name) || "New lead", S(b.category) || "General", S(b.originCountry) || region, region, S(b.quality) || "STANDARD", years, S(b.currentLocation), S(b.summary),
         !!b.hasPhone, !!b.hasWhatsApp, !!b.hasEmail, !!b.hasLinkedIn, !!b.hasCV, !!b.hasDataflow,
         S(b.firstName), S(b.lastName), S(b.phone), S(b.email), S(b.linkedIn), S(b.notes), S(b.cvUrl) || null,
         Nn(b.initialPrice), Nn(b.minPrice) || Nn(b.initialPrice), Nn(b.decayAmount), Nn(b.decayInterval) || 24, exclusive, cap,
         lt, lt === "best_offer" ? Nn(b.minBid) : null, lt === "best_offer" ? (Nn(b.reservePrice) || null) : null, bidsClose, S(b.status) || "AVAILABLE", s.companyId],
      );
      return NextResponse.json({ ok: true, id });
    }
    if (kind === "mkt.update") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const region = S(b.originRegion) || "Unknown";
      const lt = S(b.listingType) || "shared";
      const exclusive = lt === "exclusive" || !!b.isExclusive;
      const cap = exclusive ? 1 : Math.max(1, Nn(b.maxPurchases) || 3);
      const years = b.yearsExperience != null && S(b.yearsExperience) !== "" ? Nn(b.yearsExperience) : null;
      const bidsClose = S(b.bidsCloseAt) ? new Date(S(b.bidsCloseAt)) : null;
      await p.query(
        `update "marketplace_leads" set title=$2, specialty=$2, category=$3, "originCountry"=$4, "originRegion"=$5, quality=$6,
            "yearsExperience"=$7, "currentLocation"=$8, summary=$9,
            "hasPhone"=$10,"hasWhatsApp"=$11,"hasEmail"=$12,"hasLinkedIn"=$13,"hasCV"=$14,"hasDataflow"=$15,
            "firstName"=$16,"lastName"=$17,phone=$18,email=$19,"linkedIn"=$20,notes=$21,
            "initialPrice"=$22,"minPrice"=$23,"decayAmount"=$24,"decayInterval"=$25,"isExclusive"=$26,"maxPurchases"=$27,
            listing_type=$28, min_bid=$29, reserve_price=$30, bids_close_at=$31, status=$32, "updatedAt"=now()
         where id=$1`,
        [id, S(b.name), S(b.category) || "General", S(b.originCountry) || region, region, S(b.quality) || "STANDARD",
         years, S(b.currentLocation), S(b.summary),
         !!b.hasPhone, !!b.hasWhatsApp, !!b.hasEmail, !!b.hasLinkedIn, !!b.hasCV, !!b.hasDataflow,
         S(b.firstName), S(b.lastName), S(b.phone), S(b.email), S(b.linkedIn), S(b.notes),
         Nn(b.initialPrice), Nn(b.minPrice), Nn(b.decayAmount), Nn(b.decayInterval) || 24, exclusive, cap,
         lt, lt === "best_offer" ? Nn(b.minBid) : null, lt === "best_offer" ? (Nn(b.reservePrice) || null) : null, bidsClose, S(b.status) || "AVAILABLE"],
      );
      // optional CV url update (kept separate so blank doesn't wipe an existing CV)
      if (S(b.cvUrl)) await p.query(`update "marketplace_leads" set "cvUrl"=$2 where id=$1`, [id, S(b.cvUrl)]);
      return NextResponse.json({ ok: true });
    }
    if (kind === "mkt.delete") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await p.query(`delete from "marketplace_leads" where id=$1`, [id]);
      return NextResponse.json({ ok: true });
    }
    if (kind === "credit.add") {
      const companyId = S(b.companyId); const delta = Nn(b.delta);
      if (!companyId || !delta) return NextResponse.json({ error: "companyId and delta required" }, { status: 400 });
      const after = await adjustCredits(p, companyId, delta, delta > 0 ? "ADMIN_GRANT" : "ADMIN_DEDUCT", "Manual adjustment by operator");
      return NextResponse.json({ ok: true, credits: after });
    }
    if (kind === "credit.approve") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const r = (await p.query(`select "companyId", amount, status from "credit_topup_requests" where id=$1`, [id])).rows[0];
      if (!r) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      if (String(r.status).toLowerCase() === "approved") return NextResponse.json({ ok: true, already: true });
      const after = await adjustCredits(p, S(r.companyId), Nn(r.amount), "TOPUP_APPROVED", "Top-up request approved");
      await p.query(`update "credit_topup_requests" set status='APPROVED', "updatedAt"=now() where id=$1`, [id]);
      return NextResponse.json({ ok: true, credits: after });
    }
    if (kind === "demo.status") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await p.query(`update "demo_requests" set status=$2, "updatedAt"=now() where id=$1`, [id, S(b.status) || "contacted"]);
      return NextResponse.json({ ok: true });
    }
    if (kind === "question.answer") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await p.query(`update "lead_questions" set answer=$2, status='answered', "updatedAt"=now() where id=$1`, [id, S(b.answer)]);
      return NextResponse.json({ ok: true });
    }
    if (kind === "reseller.approve") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await p.query(`update "reseller_profiles" set "isApproved"=true, "updatedAt"=now() where id=$1`, [id]);
      return NextResponse.json({ ok: true });
    }
    if (kind === "payout.approve") {
      const id = S(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await p.query(`update "reseller_payouts" set status='paid', "processedAt"=now() where id=$1`, [id]);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Error" }, { status: 500 });
  }
}
