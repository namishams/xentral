"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input } from "@xentral/ui";

type S = Record<string, string>;
type Tpl = { accent: string; style: "classic" | "modern" | "minimal"; showLogo: boolean };
const PRESETS = ["#0064d9", "#0098a6", "#188918", "#6b3fd4", "#b3261e", "#1d2733"];

const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 14px" }}>{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}
function Field({ label, value, onChange, placeholder, full }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; full?: boolean }) {
  return <div style={{ gridColumn: full ? "1 / -1" : undefined }}><label style={lbl}>{label}</label><Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ width: "100%" }} /></div>;
}

export default function BooksSettingsPage() {
  const [s, setS] = React.useState<S>({});
  const [tpl, setTpl] = React.useState<Tpl>({ accent: "#0064d9", style: "modern", showLogo: true });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/books/settings").then((r) => r.json()).then((d) => {
      const x = d.settings || {};
      setS(x);
      const t = x.templateConfig || {};
      setTpl({ accent: t.accent || "#0064d9", style: t.style || "modern", showLogo: t.showLogo !== false });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k: string) => (v: string) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };

  async function save() {
    setSaving(true); setSaved(false);
    const payload = { ...s, templateConfig: tpl };
    delete (payload as Record<string, unknown>).id; delete (payload as Record<string, unknown>).companyId;
    delete (payload as Record<string, unknown>).templateConfig; (payload as Record<string, unknown>).templateConfig = tpl;
    try {
      const res = await fetch("/api/books/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, templateConfig: tpl }) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } finally { setSaving(false); }
  }

  const company = s.legalName || "Your Company LLC";

  return (
    <AppShell active="settings">
      <PageTitleRow title="Books settings & invoice designer" subtitle="Company identity, tax details and how your invoices look"
        actions={<Button variant="primary" onClick={save} disabled={saving || loading}>{saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}</Button>} />

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft }}>Loading…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 18, alignItems: "start" }}>
          <div>
            <Card title="Company identity">
              <Grid>
                <Field label="Legal name" value={s.legalName || ""} onChange={set("legalName")} placeholder="Your Company LLC" full />
                <Field label="Email" value={s.email || ""} onChange={set("email")} />
                <Field label="Phone" value={s.phone || ""} onChange={set("phone")} />
                <Field label="Website" value={s.website || ""} onChange={set("website")} />
                <Field label="Logo URL" value={s.logoUrl || ""} onChange={set("logoUrl")} placeholder="https://…/logo.png" />
                <Field label="Address" value={s.addressLine1 || ""} onChange={set("addressLine1")} />
                <Field label="City" value={s.city || ""} onChange={set("city")} />
                <Field label="Country" value={s.country || ""} onChange={set("country")} />
              </Grid>
            </Card>
            <Card title="Tax & registration (UAE)">
              <Grid>
                <Field label="VAT TRN" value={s.vatNumber || ""} onChange={set("vatNumber")} placeholder="100xxxxxxxxxxx3" />
                <Field label="Trade licence no." value={s.tradeLicenseNo || ""} onChange={set("tradeLicenseNo")} />
                <Field label="Currency" value={s.currency || "AED"} onChange={set("currency")} />
                <Field label="Invoice prefix" value={s.invoicePrefix || "INV"} onChange={set("invoicePrefix")} />
              </Grid>
            </Card>
            <Card title="Bank details">
              <Grid>
                <Field label="Bank name" value={s.bankName || ""} onChange={set("bankName")} />
                <Field label="Account name" value={s.accountName || ""} onChange={set("accountName")} />
                <Field label="IBAN" value={s.iban || ""} onChange={set("iban")} />
                <Field label="SWIFT" value={s.swift || ""} onChange={set("swift")} />
              </Grid>
            </Card>
            <Card title="Invoice designer">
              <label style={lbl}>Accent colour</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                {PRESETS.map((c) => <button key={c} onClick={() => { setTpl((t) => ({ ...t, accent: c })); setSaved(false); }} style={{ width: 28, height: 28, borderRadius: 7, background: c, border: tpl.accent === c ? `3px solid ${color.ink.DEFAULT}` : `1px solid ${color.line.strong}`, cursor: "pointer" }} />)}
                <input type="color" value={tpl.accent} onChange={(e) => { setTpl((t) => ({ ...t, accent: e.target.value })); setSaved(false); }} style={{ width: 36, height: 30, border: `1px solid ${color.line.strong}`, borderRadius: 7, background: color.surface.card, cursor: "pointer" }} />
              </div>
              <label style={lbl}>Template style</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["classic", "modern", "minimal"] as const).map((st) => { const on = tpl.style === st; return <button key={st} onClick={() => { setTpl((t) => ({ ...t, style: st })); setSaved(false); }} style={{ flex: 1, padding: "9px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", border: `1px solid ${on ? tpl.accent : color.line.strong}`, background: on ? `color-mix(in srgb, ${tpl.accent} 12%, ${color.surface.card})` : color.surface.card, color: on ? tpl.accent : color.ink.mid }}>{st}</button>; })}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: color.ink.mid, cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={tpl.showLogo} onChange={(e) => { setTpl((t) => ({ ...t, showLogo: e.target.checked })); setSaved(false); }} /> Show logo on documents
              </label>
              <label style={lbl}>Default terms</label>
              <textarea value={s.defaultTerms || ""} onChange={(e) => set("defaultTerms")(e.target.value)} rows={2} placeholder="Payment due within 14 days." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 12, resize: "vertical", fontFamily: "inherit", color: color.ink.DEFAULT, background: color.surface.card }} />
              <label style={lbl}>Footer notes</label>
              <textarea value={s.footerNotes || ""} onChange={(e) => set("footerNotes")(e.target.value)} rows={2} placeholder="Thank you for your business." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, resize: "vertical", fontFamily: "inherit", color: color.ink.DEFAULT, background: color.surface.card }} />
            </Card>
          </div>

          {/* Live preview */}
          <div style={{ position: "sticky", top: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 8 }}>Live preview</div>
            <div style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 32px -16px rgba(20,28,38,0.25)" }}>
              <div style={{ height: tpl.style === "minimal" ? 4 : 0, background: tpl.accent }} />
              <div style={{ padding: 22, color: "#1d2733" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    {tpl.showLogo ? (s.logoUrl ? <img src={s.logoUrl} alt="" style={{ height: 34, marginBottom: 6 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: tpl.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, marginBottom: 6 }}>{company[0]}</div>) : null}
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{company}</div>
                    {s.vatNumber ? <div style={{ fontSize: 11, color: "#5b6b7b" }}>TRN {s.vatNumber}</div> : null}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: tpl.style === "modern" ? 22 : 18, fontWeight: 800, color: tpl.style === "classic" ? "#1d2733" : tpl.accent }}>INVOICE</div>
                    <div style={{ fontSize: 12, color: "#5b6b7b" }}>{(s.invoicePrefix || "INV")}-2026-00006</div>
                  </div>
                </div>
                {tpl.style === "modern" ? <div style={{ height: 3, background: tpl.accent, borderRadius: 2, marginBottom: 14 }} /> : null}
                <div style={{ fontSize: 12, color: "#5b6b7b", marginBottom: 4 }}>Bill to</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Ala Yakutlar</div>
                <div style={{ borderTop: `1px solid #e4e9ef`, borderBottom: `1px solid #e4e9ef`, padding: "8px 0", fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Consulting · 2</span><span>AED 1,000.00</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Setup fee</span><span>AED 500.00</span></div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <div style={{ width: 180 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5b6b7b", padding: "3px 0" }}><span>Subtotal</span><span>AED 1,500.00</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5b6b7b", padding: "3px 0" }}><span>VAT 5%</span><span>AED 75.00</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, padding: "6px 0", borderTop: `2px solid ${tpl.accent}`, color: tpl.accent }}><span>Total</span><span>AED 1,575.00</span></div>
                  </div>
                </div>
                {s.footerNotes ? <div style={{ marginTop: 16, fontSize: 11, color: "#5b6b7b", borderTop: `1px solid #e4e9ef`, paddingTop: 10 }}>{s.footerNotes}</div> : null}
              </div>
            </div>
            <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 10 }}>Changes apply to new invoices &amp; quotes</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
