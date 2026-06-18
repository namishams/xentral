"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Panel, PanelHeader, PanelBody, StatusBadge, type BadgeTone, FactStrip, AiInlineBar } from "@xentral/ui";

type Cust = { id: string; name: string; legalName: string | null; email: string | null; phone: string | null; addressLine1: string | null; addressLine2: string | null; city: string | null; country: string | null; vatNumber: string | null; notes: string | null; contactId: string | null; accountId: string | null };
type Doc = { id: string; number: string; status: string; total: number; amountPaid?: number; currency: string; issued?: string; due?: string; valid?: string };
type Pay = { id: string; amount: number; method: string | null; date: string | null; invoiceNo: string | null };
type Data = { customer: Cust; summary: { billed: number; paid: number; outstanding: number; invoiceCount: number; quoteCount: number; currency: string }; invoices: Doc[]; quotes: Doc[]; payments: Pay[] };
type Form = { name: string; legalName: string; email: string; phone: string; addressLine1: string; addressLine2: string; city: string; country: string; vatNumber: string; notes: string };

const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ITONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", OVERDUE: "critical", CANCELLED: "neutral", ACCEPTED: "positive", REJECTED: "critical", VIEWED: "info", EXPIRED: "neutral" };

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [d, setD] = React.useState<Data | null>(null);
  const [form, setForm] = React.useState<Form | null>(null);
  const [clean, setClean] = React.useState<Form | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [accounts, setAccounts] = React.useState<{ id: string; name: string }[]>([]);
  const [changeCompany, setChangeCompany] = React.useState(false);
  const [pendCo, setPendCo] = React.useState("");
  const [newCo, setNewCo] = React.useState("");
  const [coId, setCoId] = React.useState("");
  React.useEffect(() => { fetch("/api/crm/accounts").then((r) => r.json()).then((j) => setAccounts(Array.isArray(j.rows) ? j.rows : [])).catch(() => {}); }, []);

  const load = React.useCallback(() => {
    fetch(`/api/books/customers/${params.id}`).then((r) => r.json()).then((j) => {
      if (j.error) { setD(null); setLoading(false); return; }
      setD(j); const c = j.customer;
      const f: Form = { name: c.name || "", legalName: c.legalName || "", email: c.email || "", phone: c.phone || "", addressLine1: c.addressLine1 || "", addressLine2: c.addressLine2 || "", city: c.city || "", country: c.country || "", vatNumber: c.vatNumber || "", notes: c.notes || "" };
      setForm(f); setClean(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const dirty = !!form && !!clean && (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== clean[k]);
  const set = (k: keyof Form, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  async function save() {
    if (!form) return; setBusy(true);
    try { const r = await fetch(`/api/books/customers/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (r.ok) { setClean(form); setSaved(true); setTimeout(() => setSaved(false), 2000); load(); } }
    finally { setBusy(false); }
  }

  React.useEffect(() => { if (d?.customer) setCoId(d.customer.accountId || ""); }, [d]);
  async function patchCustomer(body: Record<string, unknown>) {
    setBusy(true);
    try { const r = await fetch(`/api/books/customers/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (r.ok) load(); return r.ok; }
    finally { setBusy(false); }
  }
  async function saveCompany() { const ok = await patchCustomer({ accountId: pendCo || null }); if (ok) { setChangeCompany(false); setNewCo(""); } }
  async function createCompany() {
    const nm = newCo.trim(); if (!nm) return;
    setBusy(true);
    try {
      const r = await fetch("/api/crm/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nm }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.id) { setAccounts((prev) => [...prev, { id: j.id, name: nm }].sort((a, b) => a.name.localeCompare(b.name))); setPendCo(j.id); await patchCustomer({ accountId: j.id }); setChangeCompany(false); setNewCo(""); }
    } finally { setBusy(false); }
  }
  const coInitials = (nm: string) => (nm || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  if (loading) return <AppShell active="customers"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!d || !form) return <AppShell active="customers"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Customer not found. <a href="/customers" style={{ color: color.brand.primary }}>Back to customers</a></div></AppShell>;

  const s = d.summary; const cur = s.currency;
  const labelS: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 4 };
  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
  const linkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT, fontSize: 13 };

  return (
    <AppShell active="customers">
      <PageTitleRow title={d.customer.name} breadcrumb="Books · Customers" showIcon={false}
        actions={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button onClick={() => { window.location.href = "/quotations/new"; }}>New quote</Button>
          <Button variant="primary" onClick={() => { window.location.href = "/invoices/new"; }}>New invoice</Button>
        </div>} />

      <AiInlineBar subject={d.customer.name} />

      <Panel style={{ marginBottom: 16 }}>
        <PanelBody>
          <FactStrip facts={[
            { label: "Lifetime billed", value: aed(s.billed, cur) },
            { label: "Paid", value: aed(s.paid, cur), tone: "positive" },
            { label: "Outstanding", value: aed(s.outstanding, cur), tone: s.outstanding > 0 ? "negative" : "default" },
            { label: "Invoices", value: String(s.invoiceCount) },
            { label: "Offers", value: String(s.quoteCount) },
          ]} />
        </PanelBody>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 16, alignItems: "start" }}>
        {/* Profile (editable) */}
        <Panel>
          <PanelHeader title="Details" actions={dirty ? <Button variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button> : (saved ? <span style={{ fontSize: 12, fontWeight: 600, color: color.status.positive }}>✓ Saved</span> : <span style={{ fontSize: 11.5, color: color.ink.soft }}>Edit any field</span>)} />
          <PanelBody>
            <div style={{ display: "grid", gap: 10 }}>
              <div><label style={labelS}>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} style={fieldS} /></div>
              <div><label style={labelS}>Legal name</label><input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} style={fieldS} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={labelS}>Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={fieldS} /></div>
              </div>
              <div><label style={labelS}>VAT number (TRN)</label><input value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} placeholder="15-digit TRN" style={fieldS} /></div>
              <div><label style={labelS}>Address line 1</label><input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} style={fieldS} /></div>
              <div><label style={labelS}>Address line 2</label><input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} style={fieldS} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={labelS}>City</label><input value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldS} /></div>
                <div><label style={labelS}>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} style={fieldS} /></div>
              </div>
              <div><label style={labelS}>Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...fieldS, height: "auto", padding: 10, resize: "vertical" }} /></div>
              <div>
                <label style={labelS}>Account / company</label>
                {changeCompany ? (
                  <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: 12, background: color.surface.page, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: color.ink.mid }}>Account / company</span>
                      <button type="button" onClick={() => { setChangeCompany(false); setNewCo(""); }} style={{ fontSize: 12, fontWeight: 600, color: color.ink.soft, background: "transparent", border: 0, cursor: "pointer" }}>Close</button>
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <select autoFocus value={pendCo} onChange={(e) => setPendCo(e.target.value)} style={{ ...fieldS, flex: 1 }}>
                        <option value="">— No company —</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <Button variant="primary" onClick={saveCompany} disabled={busy}>Save</Button>
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <input value={newCo} onChange={(e) => setNewCo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createCompany(); } }} placeholder="…or create a new account" style={{ ...fieldS, flex: 1 }} />
                      <Button onClick={createCompany} disabled={busy || !newCo.trim()}>Create</Button>
                    </div>
                  </div>
                ) : coId ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px 7px 8px", borderRadius: 10, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.page }}>
                    <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{coInitials(accounts.find((a) => a.id === coId)?.name || "?")}</span>
                    <a href={`/companies/${coId}`} style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT, textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{accounts.find((a) => a.id === coId)?.name || "Linked account"}</a>
                    <button type="button" onClick={() => { setPendCo(coId); setNewCo(""); setChangeCompany(true); }} style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 8, border: `1px solid ${color.brand.primary}`, background: color.surface.card, color: color.brand.primary, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setPendCo(""); setNewCo(""); setChangeCompany(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 13px", borderRadius: 9, border: `1px dashed ${color.line.strong}`, background: color.surface.page, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Link a company</button>
                )}
              </div>
              {d.customer.contactId ? <a href={`/contacts/${d.customer.contactId}`} style={{ fontSize: 12.5, color: color.brand.primary, textDecoration: "none" }}>Open CRM contact →</a> : null}
            </div>
          </PanelBody>
        </Panel>

        {/* Documents + payments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Invoices" subtitle={`${d.invoices.length}`} actions={<a href="/invoices" style={{ fontSize: 12, color: color.brand.primary, textDecoration: "none" }}>All →</a>} />
            <PanelBody flush>
              {d.invoices.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No invoices yet.</div>
                : d.invoices.map((i) => { const bal = Math.max(0, (i.total || 0) - (i.amountPaid || 0)); return (
                  <a key={i.id} href={`/invoices/${i.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.number}</span><span style={{ fontSize: 11.5, color: color.ink.soft }}>Due {i.due || "—"}</span></span>
                    <StatusBadge tone={ITONE[i.status] ?? "neutral"} label={i.status.replace("_", " ").toLowerCase()} />
                    <span style={{ width: 110, textAlign: "right", fontWeight: 600 }}>{aed(bal > 0 ? bal : i.total, i.currency)}</span>
                  </a>); })}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Offers" subtitle={`${d.quotes.length}`} actions={<a href="/quotations" style={{ fontSize: 12, color: color.brand.primary, textDecoration: "none" }}>All →</a>} />
            <PanelBody flush>
              {d.quotes.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No offers yet.</div>
                : d.quotes.map((q) => (
                  <a key={q.id} href={`/quotations/${q.id}`} className="xui-row-link" style={linkRow}>
                    <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.number}</span><span style={{ fontSize: 11.5, color: color.ink.soft }}>Valid {q.valid || "—"}</span></span>
                    <StatusBadge tone={ITONE[q.status] ?? "neutral"} label={q.status.toLowerCase()} />
                    <span style={{ width: 110, textAlign: "right", fontWeight: 600 }}>{aed(q.total, q.currency)}</span>
                  </a>
                ))}
            </PanelBody>
          </Panel>

          {d.payments.length > 0 ? (
            <Panel>
              <PanelHeader title="Payments" subtitle={`${d.payments.length}`} />
              <PanelBody flush>
                {d.payments.map((pm) => (
                  <div key={pm.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                    <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{aed(pm.amount, cur)}</span><span style={{ fontSize: 11.5, color: color.ink.soft }}>{(pm.method || "").replace("_", " ").toLowerCase()}{pm.invoiceNo ? ` · ${pm.invoiceNo}` : ""}{pm.date ? ` · ${pm.date}` : ""}</span></span>
                    <span style={{ fontSize: 16, color: color.status.positive }}>✓</span>
                  </div>
                ))}
              </PanelBody>
            </Panel>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
