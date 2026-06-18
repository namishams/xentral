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
const newId = () => "bs" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const TEXT = ["legalName", "addressLine1", "addressLine2", "city", "country", "vatNumber", "tradeLicenseNo", "email", "phone", "website", "logoUrl", "signatureUrl", "bankName", "accountName", "iban", "swift", "paymentInstructions", "footerNotes", "defaultTerms", "currency", "invoicePrefix", "quotePrefix", "creditNotePrefix"] as const;
const INTS = ["nextQuoteNo", "nextInvoiceNo", "numberYear"] as const;

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ settings: {} });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool(url).query(`select * from "billing_settings" where "companyId" = $1 limit 1`, [session.companyId]);
    return NextResponse.json({ settings: rows[0] ?? {} });
  } catch { return NextResponse.json({ settings: {} }); }
}

export async function PUT(req: Request) {
  const url = process.env.DATABASE_URL;
  if (process.env.XENTRAL_LIVE_DATA !== "1" || !url) return NextResponse.json({ error: "Live data not enabled" }, { status: 503 });
  const session = await resolveSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  // TRN validation (15 digits)
  if (typeof b.vatNumber === "string" && b.vatNumber && !/^\d{15}$/.test(b.vatNumber)) {
    return NextResponse.json({ error: "VAT number (TRN) must be exactly 15 digits." }, { status: 400 });
  }

  const cols: string[] = [];
  const types: string[] = [];
  const vals: unknown[] = [];
  for (const k of TEXT) {
    if (k in b) {
      let v = b[k] == null ? null : String(b[k]).trim();
      if ((k === "invoicePrefix" || k === "quotePrefix" || k === "creditNotePrefix") && v) v = v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) || null;
      if (k === "currency" && !v) v = "AED";
      cols.push(k); types.push("text"); vals.push(v);
    }
  }
  for (const k of INTS) {
    if (k in b) {
      const n = parseInt(String(b[k]), 10);
      if (!isNaN(n)) { cols.push(k); types.push("int"); vals.push(n); }
    }
  }
  if ("defaultVatRate" in b) {
    const r = parseFloat(String(b.defaultVatRate));
    if (!isNaN(r) && r >= 0 && r <= 100) { cols.push("defaultVatRate"); types.push("num"); vals.push(r); }
  }

  // templateConfig (whitelisted; keeps `accent` for print pages)
  if (b.templateConfig && typeof b.templateConfig === "object") {
    const tc = b.templateConfig as Record<string, unknown>;
    const cfg: Record<string, unknown> = {};
    if (typeof tc.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(tc.accent)) cfg.accent = tc.accent;
    if (typeof tc.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(tc.accentColor)) cfg.accentColor = tc.accentColor;
    if (cfg.accent && !cfg.accentColor) cfg.accentColor = cfg.accent;
    if (cfg.accentColor && !cfg.accent) cfg.accent = cfg.accentColor;
    if (["classic", "modern", "minimal", "bold"].includes(String(tc.style))) cfg.style = tc.style;
    if (["logo-left", "logo-right"].includes(String(tc.headerLayout))) cfg.headerLayout = tc.headerLayout;
    if (["S", "M", "L"].includes(String(tc.logoSize))) cfg.logoSize = tc.logoSize;
    if (typeof tc.showLogo === "boolean") cfg.showLogo = tc.showLogo;
    if (typeof tc.showSignature === "boolean") cfg.showSignature = tc.showSignature;
    if (typeof tc.signatureName === "string") cfg.signatureName = tc.signatureName.trim().slice(0, 120) || null;
    for (const g of ["preparedBy", "preparedByPosition", "reference", "paymentMethods", "invoiceIntro", "quoteIntro"]) {
      if (typeof tc[g] === "string") cfg[g] = (tc[g] as string).trim().slice(0, 600) || null;
    }
    cols.push("templateConfig"); types.push("jsonb"); vals.push(JSON.stringify(cfg));
  }

  // complianceConfig (whitelisted)
  if (b.complianceConfig && typeof b.complianceConfig === "object") {
    const cc = b.complianceConfig as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    if (typeof cc.ctTrn === "string") out.ctTrn = cc.ctTrn.replace(/\D/g, "").slice(0, 15);
    if (["mainland", "freezone"].includes(String(cc.entityType))) out.entityType = cc.entityType;
    if (typeof cc.isQFZP === "boolean") out.isQFZP = cc.isQFZP;
    if (typeof cc.wpsEmployerId === "string") out.wpsEmployerId = cc.wpsEmployerId.trim().slice(0, 40) || null;
    if (typeof cc.wpsBankRouting === "string") out.wpsBankRouting = cc.wpsBankRouting.replace(/\D/g, "").slice(0, 9) || null;
    if (typeof cc.aspProvider === "string") out.aspProvider = cc.aspProvider.trim().slice(0, 80) || null;
    if (typeof cc.aspEndpoint === "string") out.aspEndpoint = cc.aspEndpoint.trim().slice(0, 200) || null;
    if (out.ctTrn && !/^\d{15}$/.test(out.ctTrn as string)) return NextResponse.json({ error: "Corporate Tax TRN must be 15 digits." }, { status: 400 });
    cols.push("complianceConfig"); types.push("jsonb"); vals.push(JSON.stringify(out));
  }

  if (!cols.length) return NextResponse.json({ error: "No fields" }, { status: 400 });
  const cast = (t: string, ph: string) => (t === "jsonb" ? `${ph}::jsonb` : t === "int" ? `${ph}::int` : t === "num" ? `${ph}::numeric` : ph);

  try {
    const p = pool(url);
    const existing = await p.query(`select id from "billing_settings" where "companyId" = $1`, [session.companyId]);
    if (existing.rows[0]) {
      const sets = cols.map((c, i) => `"${c}" = ${cast(types[i] as string, `$${i + 1}`)}`);
      sets.push(`"updatedAt" = now()`);
      vals.push(session.companyId);
      await p.query(`update "billing_settings" set ${sets.join(", ")} where "companyId" = $${cols.length + 1}`, vals);
    } else {
      const allCols = ["id", "companyId", ...cols];
      const params: unknown[] = [newId(), session.companyId, ...vals];
      const ph = allCols.map((_, i) => {
        if (i < 2) return `$${i + 1}`;
        return cast(types[i - 2] as string, `$${i + 1}`);
      });
      await p.query(`insert into "billing_settings" (${allCols.map((c) => `"${c}"`).join(",")}, "createdAt","updatedAt") values (${ph.join(",")}, now(), now())`, params);
    }
    const { rows } = await p.query(`select * from "billing_settings" where "companyId" = $1 limit 1`, [session.companyId]);
    return NextResponse.json({ ok: true, settings: rows[0] ?? {} });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Save failed" }, { status: 500 });
  }
}
