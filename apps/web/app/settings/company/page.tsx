"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, Panel, PanelHeader, PanelBody } from "@xentral/ui";

type Form = { name: string; phone: string; website: string; address: string; taxNumber: string; whatsApp: string; currency: string; timezone: string; dateFormat: string; locale: string };
type Company = Form & { id: string; plan: string; credits: number };

const FIELDS: { k: keyof Form; label: string; ph?: string; type?: "text" }[] = [
  { k: "name", label: "Company name", ph: "Acme Trading LLC" },
  { k: "phone", label: "Phone", ph: "+971 50 xxx xxxx" },
  { k: "whatsApp", label: "WhatsApp", ph: "+971 50 xxx xxxx" },
  { k: "website", label: "Website", ph: "https://yourcompany.ae" },
  { k: "address", label: "Address", ph: "Office address" },
  { k: "taxNumber", label: "VAT / TRN", ph: "TRN xxxxxxxxxxxxxxx" },
];
const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR"];
const TIMEZONES = ["Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Europe/London", "Europe/Berlin", "America/New_York"];
const DATEF = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const LOCALES = [["en", "English"], ["ar", "العربية"]] as const;

export default function CompanySettingsPage() {
  const [c, setC] = React.useState<Company | null>(null);
  const [form, setForm] = React.useState<Form | null>(null);
  const [clean, setClean] = React.useState<Form | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/settings/company").then((r) => r.json()).then((j) => {
      if (j.error || !j.company) { setLoading(false); return; }
      const co = j.company as Company; setC(co);
      const f: Form = { name: co.name || "", phone: co.phone || "", website: co.website || "", address: co.address || "", taxNumber: co.taxNumber || "", whatsApp: co.whatsApp || "", currency: co.currency || "AED", timezone: co.timezone || "Asia/Dubai", dateFormat: co.dateFormat || "DD/MM/YYYY", locale: co.locale || "en" };
      setForm(f); setClean(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const dirty = !!form && !!clean && (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== clean[k]);
  const set = (k: keyof Form, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  async function save() {
    if (!form) return; setBusy(true);
    try {
      const r = await fetch("/api/settings/company", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) { setClean(form); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setBusy(false); }
  }

  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
  const labelS: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };

  if (loading) return <AppShell active="settings"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!form || !c) return <AppShell active="settings"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Company settings unavailable. <a href="/settings" style={{ color: color.brand.primary }}>Back to settings</a></div></AppShell>;

  return (
    <AppShell active="settings">
      <PageTitleRow title="Company profile" breadcrumb="Settings · Company"
        badge={<StatusBadge tone="info" label={`${c.plan || "FREE"} plan`} />}
        actions={dirty ? <Button variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button> : (saved ? <span style={{ fontSize: 12.5, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : null)} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Identity & contact" subtitle="Shown on invoices, quotes and emails" />
          <PanelBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {FIELDS.map((f) => (
                <div key={f.k}><label style={labelS}>{f.label}{f.k === "name" ? " *" : ""}</label>
                  <input value={form[f.k]} placeholder={f.ph} onChange={(e) => set(f.k, e.target.value)} style={fieldS} /></div>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Localisation" subtitle="Currency, timezone & formats" />
            <PanelBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={labelS}>Currency</label><select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={fieldS}>{CURRENCIES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                <div><label style={labelS}>Timezone</label><select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} style={fieldS}>{TIMEZONES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                <div><label style={labelS}>Date format</label><select value={form.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} style={fieldS}>{DATEF.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
                <div><label style={labelS}>Language</label><select value={form.locale} onChange={(e) => set("locale", e.target.value)} style={fieldS}>{LOCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              </div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Plan & credits" />
            <PanelBody>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 13 }}><span style={{ color: color.ink.soft }}>Plan</span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{c.plan || "FREE"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}><span style={{ color: color.ink.soft }}>Credits</span><span style={{ fontWeight: 600, color: color.status.positive }}>AED {Number(c.credits || 0).toLocaleString()}</span></div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <a href="/billing" style={{ textDecoration: "none" }}><Button>Manage billing</Button></a>
                <a href="/books/settings" style={{ textDecoration: "none" }}><Button>Invoice designer</Button></a>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
