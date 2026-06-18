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
