"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { SendComposer } from "../../../components/send-composer";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, FactStrip, AskAiButton } from "@xentral/ui";
import { DocTimeline } from "../../../components/doc-timeline";

type Line = { name: string; description: string | null; qty: number; unitPrice: number; vatRate?: number; discountPct?: number; lineTotal: number };
type Pay = { id: string; amount: number; method: string | null; reference: string | null; date: string | null };
type Inv = { id: string; number: string; status: string; total: number; amountPaid: number; subtotal: number; vatTotal: number; currency: string; issued: string | null; due: string | null; dueDateRaw: string | null; notes: string | null; customer: string; customerEmail: string | null; token?: string | null; payments?: Pay[] };
const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral", OVERDUE: "critical" };
const STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];
const METHODS = ["BANK_TRANSFER", "CARD", "CASH", "CHEQUE", "TELR", "OTHER"];

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [inv, setInv] = React.useState<Inv | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState("");
  const [sendOpen, setSendOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<{ status: string; dueDate: string; notes: string } | null>(null);
  const [pay, setPay] = React.useState<{ amount: string; method: string; reference: string; paidAt: string } | null>(null);

  const load = React.useCallback(() => {
    fetch(`/api/books/invoices/${params.id}`).then((r) => r.json()).then((d) => { setInv(d.invoice ?? null); setLines(d.lines ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const payUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${params.id}` : "";
  const bal = inv ? Math.max(0, (inv.total || 0) - (inv.amountPaid || 0)) : 0;

  function send() { setSendOpen(true); }
  function copyLink() { navigator.clipboard?.writeText(payUrl).then(() => setToast("Pay link copied")); }
  function openPdf() { window.open(`/api/books/invoices/${params.id}/pdf`, "_blank"); }
  function openEdit() { if (inv) setEdit({ status: inv.status, dueDate: inv.dueDateRaw || "", notes: inv.notes || "" }); }
  function openPay() { setPay({ amount: bal ? String(bal.toFixed(2)) : "", method: "BANK_TRANSFER", reference: "", paidAt: new Date().toISOString().slice(0, 10) }); }
  async function saveEdit() {
    if (!edit) return; setBusy("edit");
    try { const res = await fetch(`/api/books/invoices/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: edit.status, dueDate: edit.dueDate || null, notes: edit.notes }) }); if (res.ok) { setEdit(null); setToast("Saved"); load(); } else { const j = await res.json().catch(() => ({})); setToast(j.error || "Could not save"); } }
    finally { setBusy(null); }
  }
  async function recordPayment() {
    if (!pay) return; const amt = parseFloat(pay.amount); if (!(amt > 0)) { setToast("Enter an amount"); return; }
    setBusy("pay");
    try {
      const res = await fetch(`/api/books/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId: params.id, amount: amt, method: pay.method, reference: pay.reference || null, paidAt: pay.paidAt || null }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setPay(null); setToast(`Payment of ${aed(amt, inv?.currency)} recorded`); load(); } else setToast(d.error || "Could not record payment");
    } catch { setToast("Network error"); } finally { setBusy(null); }
  }
  async function duplicate() {
    setBusy("dup"); setToast("");
    try { const res = await fetch(`/api/books/invoices/${params.id}/duplicate`, { method: "POST" }); const d = await res.json(); if (res.ok) { window.location.href = `/invoices/${d.id}`; } else setToast(d.error || "Could not duplicate"); }
    catch { setToast("Network error"); } finally { setBusy(null); }
  }
  async function einvoice() {
    setBusy("einv"); setToast("");
    try {
      const res = await fetch(`/api/books/invoices/${params.id}/einvoice`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (d.ok) { setToast("FTA e-invoice validated ✓ — downloading XML"); window.open(`/api/books/invoices/${params.id}/einvoice`, "_blank"); }
      else setToast(d.errors ? `e-Invoice invalid: ${d.errors[0]}` : (d.error || "Could not generate e-invoice"));
    } catch { setToast("Network error"); } finally { setBusy(null); }
  }
  function shareLink() { const t = inv?.token; if (!t) { setToast("No share link"); return; } navigator.clipboard?.writeText(`${window.location.origin}/i/${t}`).then(() => setToast("Public invoice link copied")); }

  if (loading) return <AppShell active="invoice"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!inv) return <AppShell active="invoice"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Invoice not found. <a href="/invoices" style={{ color: color.brand.primary }}>Back to invoices</a></div></AppShell>;

  const overdue = ["SENT", "PARTIALLY_PAID"].includes(inv.status) && !!inv.dueDateRaw && new Date(inv.dueDateRaw).getTime() < Date.now();
  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, marginBottom: 12 };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
  const th: React.CSSProperties = { padding: "9px 16px", fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: color.ink.mid, textTransform: "uppercase", background: color.surface.page, borderBottom: `1px solid ${color.line.strong}` };
  const td: React.CSSProperties = { padding: "11px 16px", fontSize: 13, color: color.ink.DEFAULT, borderBottom: `1px solid ${color.line.DEFAULT}`, verticalAlign: "top" };

  return (
    <AppShell active="invoice">
      <PageTitleRow title={`Invoice ${inv.number}`} breadcrumb="Books · Invoices"
        badge={<StatusBadge tone={TONE[inv.status] ?? "neutral"} label={inv.status.replace("_", " ").toLowerCase()} />}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AskAiButton label="Ask AI" seed={`Draft a polite payment reminder email for invoice ${inv.number} to ${inv.customer || "the customer"}. Outstanding balance ${aed(bal, inv.currency)}, due ${inv.due || "soon"}.`} />
          <Button onClick={() => { window.location.href = "/invoices/" + params.id + "/edit"; }}>Edit</Button>
          <Button onClick={openEdit}>Status</Button>
          <Button onClick={openPdf}>Download PDF</Button>
          <Button onClick={duplicate} disabled={busy === "dup"}>{busy === "dup" ? "Duplicating…" : "Duplicate"}</Button>
          <Button onClick={einvoice} disabled={busy === "einv"}>{busy === "einv" ? "Validating…" : "e-Invoice (FTA)"}</Button>
          {bal > 0 ? <Button onClick={openPay}>Record payment</Button> : null}
          <Button onClick={shareLink}>Share link</Button>
          <Button variant="primary" onClick={send} disabled={busy === "send"}>{busy === "send" ? "Sending…" : "Send to customer"}</Button>
        </div>} />

      {toast ? <div style={{ background: `color-mix(in srgb, ${color.brand.primary} 10%, ${color.surface.card})`, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 9, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{toast}</div> : null}

      <Panel style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, padding: "18px 20px", borderBottom: `1px solid ${color.line.DEFAULT}`, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 4 }}>Billed to</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>{inv.customer || "—"}</div>
            <div style={{ fontSize: 12.5, color: color.ink.mid }}>{inv.customerEmail || "No email on file"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 2 }}>{bal > 0 ? "Balance due" : "Total"}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: bal > 0 ? color.status.negative : color.status.positive, lineHeight: 1.1 }}>{aed(bal > 0 ? bal : inv.total, inv.currency)}</div>
            {bal > 0 ? <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 2 }}>of {aed(inv.total, inv.currency)}</div> : <div style={{ fontSize: 12, color: color.status.positive, marginTop: 2 }}>Paid in full</div>}
          </div>
        </div>
        <PanelBody>
          <FactStrip facts={[
            { label: "Issued", value: inv.issued || "—" },
            { label: "Due date", value: inv.due || "—", tone: overdue ? "negative" : "default" },
            { label: "Subtotal", value: aed(inv.subtotal, inv.currency) },
            { label: "VAT", value: aed(inv.vatTotal, inv.currency) },
            { label: "Paid", value: aed(inv.amountPaid, inv.currency), tone: inv.amountPaid > 0 ? "positive" : "default" },
          ]} />
        </PanelBody>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Line items" subtitle={`${lines.length} ${lines.length === 1 ? "item" : "items"}`}
            actions={<Button onClick={() => { window.location.href = "/invoices/" + params.id + "/edit"; }}>Edit</Button>} />
          <PanelBody flush>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ ...th, textAlign: "left" }}>Item</th>
                <th style={{ ...th, textAlign: "right", width: 70 }}>Qty</th>
                <th style={{ ...th, textAlign: "right", width: 120 }}>Price</th>
                <th style={{ ...th, textAlign: "right", width: 70 }}>VAT</th>
                <th style={{ ...th, textAlign: "right", width: 130 }}>Amount</th>
              </tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="xui-tr">
                    <td style={{ ...td, textAlign: "left" }}>
                      <span style={{ fontWeight: 600 }}>{l.name}</span>
                      {l.description ? <span style={{ display: "block", fontSize: 12, color: color.ink.soft, marginTop: 2 }}>{l.description}</span> : null}
                    </td>
                    <td style={{ ...td, textAlign: "right", color: color.ink.mid }}>{Number(l.qty)}</td>
                    <td style={{ ...td, textAlign: "right", color: color.ink.mid }}>{aed(l.unitPrice, inv.currency)}</td>
                    <td style={{ ...td, textAlign: "right", color: color.ink.soft }}>{l.vatRate != null ? `${Number(l.vatRate)}%` : "—"}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{aed(l.lineTotal, inv.currency)}</td>
                  </tr>
                ))}
                {lines.length === 0 ? <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>No line items</td></tr> : null}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px", borderTop: `1px solid ${color.line.DEFAULT}` }}>
              <div style={{ width: 260 }}>
                <Row k="Subtotal" v={aed(inv.subtotal, inv.currency)} />
                <Row k="VAT" v={aed(inv.vatTotal, inv.currency)} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, padding: "8px 0", borderTop: `2px solid ${color.ink.DEFAULT}`, marginTop: 4, color: color.ink.DEFAULT }}><span>Total</span><span>{aed(inv.total, inv.currency)}</span></div>
                {inv.amountPaid > 0 ? <Row k="Paid" v={`− ${aed(inv.amountPaid, inv.currency)}`} /> : null}
                {bal > 0 ? <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, color: color.status.negative, padding: "4px 0" }}><span>Balance due</span><span>{aed(bal, inv.currency)}</span></div> : null}
              </div>
            </div>
            {inv.notes ? <div style={{ padding: "14px 16px", fontSize: 12.5, color: color.ink.mid, borderTop: `1px solid ${color.line.DEFAULT}`, background: color.surface.page }}><b style={{ color: color.ink.DEFAULT }}>Notes</b><br />{inv.notes}</div> : null}
          </PanelBody>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Payments" subtitle={bal > 0 ? `${aed(bal, inv.currency)} outstanding` : "Settled"} actions={bal > 0 ? <Button variant="primary" onClick={openPay}>Record</Button> : undefined} />
            <PanelBody flush>
              {(inv.payments && inv.payments.length > 0) ? inv.payments.map((pmt) => (
                <div key={pmt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                  <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(pmt.amount, inv.currency)}</span><span style={{ fontSize: 11.5, color: color.ink.soft }}>{(pmt.method || "").replace("_", " ").toLowerCase()}{pmt.reference ? ` · ${pmt.reference}` : ""}{pmt.date ? ` · ${pmt.date}` : ""}</span></span>
                  <span style={{ fontSize: 16, color: color.status.positive }}>✓</span>
                </div>
              )) : <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No payments recorded yet.</div>}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Customer" />
            <PanelBody>
              <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{inv.customer || "—"}</div>
              <div style={{ fontSize: 13, color: color.ink.mid }}>{inv.customerEmail || "No email on file"}</div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Payment link" />
            <PanelBody>
              <div style={{ fontSize: 12, color: color.ink.soft, wordBreak: "break-all", background: color.surface.sunken, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>{payUrl}</div>
              <div style={{ display: "flex", gap: 8 }}><Button onClick={copyLink}>Copy link</Button><a href={payUrl} target="_blank" rel="noreferrer"><Button>Open</Button></a></div>
              <p style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 14, lineHeight: 1.5 }}>“Send to customer” emails a branded invoice with a secure <b>Pay with Telr</b> button and the PDF attached.</p>
            </PanelBody>
          </Panel>
          <DocTimeline docType="INVOICE" docId={params.id} />
        </div>
      </div>

      {edit ? (
        <div onClick={() => !busy && setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Quick edit — status, date & note</h2>
              <button aria-label="Close" onClick={() => setEdit(null)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <label style={lbl}>Status</label>
            <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} style={fieldS}>{STATUSES.map((st) => <option key={st} value={st}>{st.replace("_", " ").toLowerCase()}</option>)}</select>
            <label style={lbl}>Due date</label>
            <input type="date" value={edit.dueDate} onChange={(e) => setEdit({ ...edit, dueDate: e.target.value })} style={fieldS} />
            <label style={lbl}>Notes</label>
            <textarea value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={3} style={{ ...fieldS, height: "auto", padding: 11, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setEdit(null)} disabled={busy === "edit"}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit} disabled={busy === "edit"}>{busy === "edit" ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {pay ? (
        <div onClick={() => busy !== "pay" && setPay(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Record payment</h2>
              <button aria-label="Close" onClick={() => setPay(null)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: 12.5, color: color.ink.soft, margin: "0 0 14px" }}>Outstanding: <b style={{ color: color.status.negative }}>{aed(bal, inv.currency)}</b></p>
            <label style={lbl}>Amount ({inv.currency})</label>
            <input value={pay.amount} inputMode="decimal" onChange={(e) => setPay({ ...pay, amount: e.target.value })} style={fieldS} />
            <label style={lbl}>Method</label>
            <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} style={fieldS}>{METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ").toLowerCase()}</option>)}</select>
            <label style={lbl}>Reference (optional)</label>
            <input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="Transfer ref / cheque no." style={fieldS} />
            <label style={lbl}>Date</label>
            <input type="date" value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} style={fieldS} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setPay(null)} disabled={busy === "pay"}>Cancel</Button>
              <Button variant="primary" onClick={recordPayment} disabled={busy === "pay"}>{busy === "pay" ? "Saving…" : "Record payment"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    {sendOpen && inv ? <SendComposer kind="invoice" id={params.id} docNumber={inv.number} onClose={() => setSendOpen(false)} onSent={(t) => { setToast(`Sent to ${t}`); load(); }} /> : null}
      </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
