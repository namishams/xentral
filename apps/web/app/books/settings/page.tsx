"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input } from "@xentral/ui";

type S = Record<string, unknown>;
type Tc = Record<string, unknown>;
type Cc = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const trn15 = (v: string) => /^\d{15}$/.test(v);

const UAE_BANKS: { name: string; code: string }[] = [
  { name: "Emirates NBD", code: "302610122" },
  { name: "First Abu Dhabi Bank (FAB)", code: "304070157" },
  { name: "Abu Dhabi Commercial Bank (ADCB)", code: "303010109" },
  { name: "Dubai Islamic Bank", code: "302420126" },
  { name: "Mashreq Bank", code: "301860131" },
  { name: "WIO Bank", code: "401050108" },
  { name: "RAKBANK", code: "302810133" },
  { name: "Commercial Bank of Dubai", code: "302230114" },
  { name: "Abu Dhabi Islamic Bank (ADIB)", code: "304130128" },
];
const PRESETS = ["#0064d9", "#0098a6", "#188918", "#6b3fd4", "#b3261e", "#1d2733"];

const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const hintS: React.CSSProperties = { fontSize: 11, color: color.ink.soft, marginTop: 4 };
const errS: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#c0392b", marginTop: 4 };
const selS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
const taS: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, resize: "vertical", fontFamily: "inherit", color: color.ink.DEFAULT, background: color.surface.card };
const uploadBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", background: color.surface.card, border: `1px solid ${color.line.strong}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: color.ink.DEFAULT, cursor: "pointer", flexShrink: 0 };
const previewLink: React.CSSProperties = { display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", background: color.surface.card, border: `1px solid ${color.line.strong}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: color.brand.primary, textDecoration: "none" };

function Section({ icon, title, description, children }: { icon: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid ${color.line.DEFAULT}`, padding: "14px 18px" }}>
        <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: 0, lineHeight: 1.3 }}>{title}</h2>
          {description ? <p style={{ fontSize: 12, color: color.ink.soft, margin: "3px 0 0", lineHeight: 1.5 }}>{description}</p> : null}
        </div>
      </div>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </section>
  );
}
function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 12 }}>{children}</div>;
}

export default function BooksSettingsPage() {
  const [s, setS] = React.useState<S>({});
  const [tc, setTc] = React.useState<Tc>({});
  const [cc, setCc] = React.useState<Cc>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    fetch("/api/books/settings").then((r) => r.json()).then((d) => {
      const x = (d.settings || {}) as S;
      setS(x);
      setTc((x.templateConfig as Tc) || {});
      setCc((x.complianceConfig as Cc) || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setS((p) => ({ ...p, [k]: e.target.value })); setSaved(false); };
  const setT = (k: string, v: unknown) => { setTc((p) => ({ ...p, [k]: v })); setSaved(false); };
  const setC = (k: string, v: unknown) => { setCc((p) => ({ ...p, [k]: v })); setSaved(false); };
  const ts = (k: string) => str(tc[k]);
  const cs = (k: string) => str(cc[k]);

  async function save() {
    setSaving(true); setSaved(false); setErr("");
    try {
      const res = await fetch("/api/books/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, templateConfig: tc, complianceConfig: cc }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error || "Could not save settings"); return; }
      if (d.settings) { setS(d.settings); setTc((d.settings.templateConfig as Tc) || {}); setCc((d.settings.complianceConfig as Cc) || {}); }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  const upload = (kind: "logo" | "signature") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file); fd.append("kind", kind);
    const r = await fetch("/api/books/settings/upload", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Upload failed"); return; }
    setS((p) => ({ ...p, [kind === "logo" ? "logoUrl" : "signatureUrl"]: d.url })); setSaved(false);
  };

  const F = ({ k, label, hint, placeholder, type = "text", full }: { k: string; label: string; hint?: string; placeholder?: string; type?: string; full?: boolean }) => (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label style={lbl}>{label}</label>
      <Input type={type} value={str(s[k])} onChange={set(k)} placeholder={placeholder} style={{ width: "100%" }} />
      {hint ? <p style={hintS}>{hint}</p> : null}
    </div>
  );
  const TF = ({ k, label, placeholder }: { k: string; label: string; placeholder?: string }) => (
    <div><label style={lbl}>{label}</label><Input value={ts(k)} onChange={(e) => setT(k, e.target.value)} placeholder={placeholder} style={{ width: "100%" }} /></div>
  );

  const accent = ts("accent") || "#0064d9";
  const company = str(s.legalName) || "Your Company LLC";
  const vat = str(s.vatNumber);
  const ctTrn = cs("ctTrn");

  return (
    <AppShell active="settings">
      <PageTitleRow title="Billing settings" subtitle="Everything here appears on your quotes and invoices"
        actions={<Button variant="primary" onClick={save} disabled={saving || loading}>{saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}</Button>} />

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div> : (
        <>
          {err ? <div style={{ background: "#fdecea", border: "1px solid #f5c6c2", color: "#a4322a", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{err}</div> : null}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)", gap: 18, alignItems: "start" }}>
            <div>
              {/* 1 — Company & legal */}
              <Section icon="🏢" title="Company & legal" description="Shown in the document header. The TRN is required for FTA-compliant tax invoices.">
                <Grid>
                  <F k="legalName" label="Legal company name" placeholder="ICSL FZE" />
                  <F k="tradeLicenseNo" label="Trade license number" />
                </Grid>
                <Grid>
                  <div>
                    <label style={lbl}>VAT number (TRN)</label>
                    <Input value={vat} onChange={set("vatNumber")} placeholder="15-digit TRN" style={{ width: "100%" }} />
                    {vat ? (trn15(vat) ? <p style={hintS}>✓ Valid 15-digit TRN</p> : <p style={errS}>TRN must be exactly 15 digits</p>) : <p style={hintS}>Printed on every tax invoice</p>}
                  </div>
                  <F k="country" label="Country" placeholder="United Arab Emirates" />
                </Grid>
                <Grid>
                  <F k="addressLine1" label="Address line 1" />
                  <F k="addressLine2" label="Address line 2" />
                </Grid>
                <Grid>
                  <F k="city" label="City" placeholder="Dubai" />
                  <F k="website" label="Website" placeholder="https://…" />
                </Grid>
                <Grid>
                  <F k="email" label="Billing email" type="email" />
                  <F k="phone" label="Phone" />
                </Grid>
              </Section>

              {/* 2 — Document details */}
              <Section icon="📄" title="Document details" description="Optional. Shown on every quote and invoice — who prepared it, accepted payment methods, and an intro line.">
                <Grid>
                  <TF k="preparedBy" label="Prepared by" placeholder="e.g. Nami Shams" />
                  <TF k="preparedByPosition" label="Position" placeholder="e.g. Account Director" />
                </Grid>
                <Grid>
                  <TF k="reference" label="Reference" placeholder="PO / internal ref" />
                  <TF k="paymentMethods" label="Payment methods" placeholder="Bank transfer · Cheque · Card" />
                </Grid>
                <Grid>
                  <div><label style={lbl}>Invoice intro (optional)</label><textarea rows={2} value={ts("invoiceIntro")} onChange={(e) => setT("invoiceIntro", e.target.value)} placeholder="Thank you for your business." style={taS} /><p style={hintS}>Leave blank to omit.</p></div>
                  <div><label style={lbl}>Quote intro (optional)</label><textarea rows={2} value={ts("quoteIntro")} onChange={(e) => setT("quoteIntro", e.target.value)} placeholder="We are pleased to share this proposal." style={taS} /></div>
                </Grid>
              </Section>

              {/* 3 — Document design */}
              <Section icon="🎨" title="Document design" description="Your logo, colors and layout — applied to every quote and invoice.">
                <Grid cols={3}>
                  <div>
                    <label style={lbl}>Company logo</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {str(s.logoUrl) ? <img src={str(s.logoUrl)} alt="Logo" style={{ height: 38, maxWidth: 130, objectFit: "contain", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 7, background: "#fff", padding: 3 }} /> : <span style={{ fontSize: 12, color: color.ink.soft }}>No logo — company name used</span>}
                      <label style={uploadBtn}>Upload<input type="file" accept=".png,.jpg,.jpeg" style={{ display: "none" }} onChange={upload("logo")} /></label>
                    </div>
                    <p style={hintS}>PNG or JPG, max 2 MB. Transparent PNG looks best.</p>
                  </div>
                  <div>
                    <label style={lbl}>Signature (printed on offers)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {str(s.signatureUrl) ? <img src={str(s.signatureUrl)} alt="Signature" style={{ height: 38, maxWidth: 130, objectFit: "contain", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 7, background: "#fff", padding: 3 }} /> : <span style={{ fontSize: 12, color: color.ink.soft }}>No signature image</span>}
                      <label style={uploadBtn}>Upload<input type="file" accept=".png,.jpg,.jpeg" style={{ display: "none" }} onChange={upload("signature")} /></label>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Accent color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {PRESETS.map((c) => <button key={c} onClick={() => setT("accent", c)} style={{ width: 26, height: 26, borderRadius: 7, background: c, border: accent === c ? `3px solid ${color.ink.DEFAULT}` : `1px solid ${color.line.strong}`, cursor: "pointer" }} />)}
                      <input type="color" value={accent} onChange={(e) => setT("accent", e.target.value)} style={{ width: 34, height: 28, borderRadius: 7, border: `1px solid ${color.line.strong}`, background: color.surface.card, cursor: "pointer", padding: 2 }} />
                    </div>
                    <p style={hintS}>Used for document number and total.</p>
                  </div>
                </Grid>
                <Grid cols={3}>
                  <div>
                    <label style={lbl}>Logo position</label>
                    <select value={ts("headerLayout") || "logo-left"} onChange={(e) => setT("headerLayout", e.target.value)} style={selS}>
                      <option value="logo-left">Left, above title</option>
                      <option value="logo-right">Right, beside company details</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Logo size</label>
                    <select value={ts("logoSize") || "M"} onChange={(e) => setT("logoSize", e.target.value)} style={selS}>
                      <option value="S">Small</option><option value="M">Medium</option><option value="L">Large</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Template style</label>
                    <select value={ts("style") || "modern"} onChange={(e) => setT("style", e.target.value)} style={selS}>
                      <option value="classic">Classic</option><option value="modern">Modern</option><option value="minimal">Minimal</option>
                    </select>
                  </div>
                </Grid>
                <div><label style={lbl}>Signature name on offers</label><Input value={ts("signatureName")} onChange={(e) => setT("signatureName", e.target.value)} placeholder="e.g. Nami Shams, Managing Director" style={{ width: "100%" }} /></div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, paddingTop: 2 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: color.ink.mid, cursor: "pointer" }}>
                    <input type="checkbox" checked={tc.showSignature !== false} onChange={(e) => setT("showSignature", e.target.checked)} style={{ width: 16, height: 16, accentColor: color.brand.primary }} /> Show signature block on offers
                  </label>
                  <a href="/api/books/preview?kind=QUOTE" target="_blank" rel="noopener noreferrer" style={previewLink}>Preview offer PDF</a>
                  <a href="/api/books/preview?kind=INVOICE" target="_blank" rel="noopener noreferrer" style={previewLink}>Preview invoice PDF</a>
                  <span style={{ fontSize: 12, color: color.ink.soft }}>Save settings first, then preview</span>
                </div>
              </Section>

              {/* 4 — Bank & payment */}
              <Section icon="🏦" title="Bank & payment" description="Printed in the payment box on every invoice.">
                <Grid>
                  <F k="bankName" label="Bank name" placeholder="WIO Bank" />
                  <F k="accountName" label="Account name" />
                </Grid>
                <Grid>
                  <F k="iban" label="IBAN" />
                  <F k="swift" label="SWIFT / BIC" />
                </Grid>
                <div><label style={lbl}>Payment instructions</label><textarea rows={3} value={str(s.paymentInstructions)} onChange={set("paymentInstructions")} placeholder="e.g. Please include the invoice number as payment reference." style={taS} /></div>
              </Section>

              {/* 5 — Numbering & terms */}
              <Section icon="#️⃣" title="Numbering & terms" description="Numbering format: PREFIX-YEAR-NUMBER, e.g. INV-2026-00001. Counters never repeat within a year.">
                <Grid cols={3}>
                  <F k="quotePrefix" label="Quote prefix" placeholder="QUO" />
                  <F k="invoicePrefix" label="Invoice prefix" placeholder="INV" />
                  <F k="creditNotePrefix" label="Credit note prefix" placeholder="CN" />
                </Grid>
                <Grid cols={3}>
                  <F k="nextQuoteNo" label="Next quote number" type="number" />
                  <F k="nextInvoiceNo" label="Next invoice number" type="number" />
                  <F k="numberYear" label="Numbering year" type="number" />
                </Grid>
                <Grid>
                  <F k="currency" label="Currency" placeholder="AED" />
                  <F k="defaultVatRate" label="Default VAT %" type="number" hint="UAE standard rate: 5%" />
                </Grid>
                <div><label style={lbl}>Default terms &amp; conditions</label><textarea rows={3} value={str(s.defaultTerms)} onChange={set("defaultTerms")} placeholder="Printed at the bottom of quotes and invoices unless overridden per document." style={taS} /></div>
                <div><label style={lbl}>Footer notes</label><textarea rows={2} value={str(s.footerNotes)} onChange={set("footerNotes")} placeholder="e.g. Thank you for your business." style={taS} /></div>
              </Section>

              {/* 6 — Tax & compliance */}
              <Section icon="🛡️" title="Tax & compliance (UAE)" description="Corporate Tax, FTA e-invoicing (ASP) and WPS payroll bank — your connect-ready credentials.">
                <Grid>
                  <div>
                    <label style={lbl}>Corporate Tax TRN</label>
                    <Input value={ctTrn} onChange={(e) => setC("ctTrn", e.target.value)} placeholder="15-digit CT TRN" style={{ width: "100%" }} />
                    {ctTrn ? (trn15(ctTrn) ? <p style={hintS}>✓ Valid</p> : <p style={errS}>CT TRN must be 15 digits</p>) : null}
                  </div>
                  <div>
                    <label style={lbl}>Entity type</label>
                    <select value={cs("entityType") || "mainland"} onChange={(e) => setC("entityType", e.target.value)} style={selS}>
                      <option value="mainland">Mainland</option><option value="freezone">Free Zone</option>
                    </select>
                  </div>
                </Grid>
                {cs("entityType") === "freezone" ? (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: color.ink.DEFAULT, cursor: "pointer" }}>
                    <input type="checkbox" checked={cc.isQFZP === true} onChange={(e) => setC("isQFZP", e.target.checked)} style={{ width: 16, height: 16, accentColor: color.brand.primary }} /> Qualifying Free Zone Person (0% on qualifying income)
                  </label>
                ) : null}

                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: color.ink.soft, margin: "4px 0 0" }}>FTA e-invoicing (accredited service provider)</p>
                <Grid>
                  <div><label style={lbl}>ASP provider</label><Input value={cs("aspProvider")} onChange={(e) => setC("aspProvider", e.target.value)} placeholder="e.g. your accredited ASP" style={{ width: "100%" }} /></div>
                  <div><label style={lbl}>ASP API endpoint</label><Input value={cs("aspEndpoint")} onChange={(e) => setC("aspEndpoint", e.target.value)} placeholder="https://asp.example.com/api" style={{ width: "100%" }} /></div>
                </Grid>

                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: color.ink.soft, margin: "4px 0 0" }}>WPS payroll bank</p>
                <Grid>
                  <div><label style={lbl}>Employer establishment ID</label><Input value={cs("wpsEmployerId")} onChange={(e) => setC("wpsEmployerId", e.target.value)} placeholder="MOL employer ID" style={{ width: "100%" }} /></div>
                  <div>
                    <label style={lbl}>WPS bank</label>
                    <select value={cs("wpsBankRouting")} onChange={(e) => setC("wpsBankRouting", e.target.value)} style={selS}>
                      <option value="">Select bank…</option>
                      {UAE_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                  </div>
                </Grid>
                <p style={{ fontSize: 11, color: color.ink.soft, margin: 0 }}>Xentral generates &amp; validates the compliant files; live FTA transmission and salary disbursement run through your accredited ASP and WPS bank.</p>
              </Section>

              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 2px 8px" }}>
                <span style={{ marginRight: "auto", fontSize: 12, color: color.ink.soft }}>Saved settings apply to all new quotes and invoices.</span>
                <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}</Button>
              </div>
            </div>

            {/* Live preview */}
            <div style={{ position: "sticky", top: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 8 }}>Live preview</div>
              <div style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 32px -16px rgba(20,28,38,0.25)" }}>
                <div style={{ height: ts("style") === "minimal" ? 4 : 0, background: accent }} />
                <div style={{ padding: 22, color: "#1d2733" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                      {str(s.logoUrl) ? <img src={str(s.logoUrl)} alt="" style={{ height: 34, marginBottom: 6 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, marginBottom: 6 }}>{company[0]}</div>}
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{company}</div>
                      {vat ? <div style={{ fontSize: 11, color: "#5b6b7b" }}>TRN {vat}</div> : null}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: ts("style") === "modern" ? 22 : 18, fontWeight: 800, color: ts("style") === "classic" ? "#1d2733" : accent }}>INVOICE</div>
                      <div style={{ fontSize: 12, color: "#5b6b7b" }}>{str(s.invoicePrefix) || "INV"}-{str(s.numberYear) || "2026"}-00006</div>
                    </div>
                  </div>
                  {ts("style") === "modern" ? <div style={{ height: 3, background: accent, borderRadius: 2, marginBottom: 14 }} /> : null}
                  <div style={{ fontSize: 12, color: "#5b6b7b", marginBottom: 4 }}>Bill to</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Sample Customer LLC</div>
                  <div style={{ borderTop: "1px solid #e4e9ef", borderBottom: "1px solid #e4e9ef", padding: "8px 0", fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Consulting · 2</span><span>{str(s.currency) || "AED"} 1,000.00</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Setup fee</span><span>{str(s.currency) || "AED"} 500.00</span></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <div style={{ width: 190 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5b6b7b", padding: "3px 0" }}><span>Subtotal</span><span>{str(s.currency) || "AED"} 1,500.00</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5b6b7b", padding: "3px 0" }}><span>VAT {str(s.defaultVatRate) || "5"}%</span><span>{str(s.currency) || "AED"} 75.00</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, padding: "6px 0", borderTop: `2px solid ${accent}`, color: accent }}><span>Total</span><span>{str(s.currency) || "AED"} 1,575.00</span></div>
                    </div>
                  </div>
                  {str(s.footerNotes) ? <div style={{ marginTop: 16, fontSize: 11, color: "#5b6b7b", borderTop: "1px solid #e4e9ef", paddingTop: 10 }}>{str(s.footerNotes)}</div> : null}
                </div>
              </div>
              <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 10 }}>Changes apply to new invoices &amp; quotes</p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
