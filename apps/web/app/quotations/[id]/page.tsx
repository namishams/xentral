"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, FactStrip, AskAiButton } from "@xentral/ui";
import { AttachmentsPanel } from "../../../components/attachments-panel";

type Line = { name: string; description: string | null; qty: number; unitPrice: number; vatRate?: number; discountPct?: number; lineTotal: number };
type Q = { id: string; number: string; status: string; total: number; subtotal: number; vatTotal: number; currency: string; issued: string | null; valid: string | null; validRaw: string | null; notes: string | null; token: string; customer: string; customerEmail: string | null; invoiceId: string | null; invoiceNumber: string | null; converted: boolean; sentAt: string | null };
const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", VIEWED: "info", ACCEPTED: "positive", REJECTED: "critical", EXPIRED: "neutral", INVOICED: "positive" };
const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const [q, setQ] = React.useState<Q | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState("");
  const [edit, setEdit] = React.useState<{ status: string; validUntil: string; notes: string } | null>(null);

  const load = React.useCallback(() => {
    fetch(`/api/books/quotes/${params.id}`).then((r) => r.json()).then((d) => { setQ(d.quote ?? null); setLines(d.lines ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const viewUrl = q && typeof window !== "undefined" ? `${window.location.origin}/q/${q.token}` : "";

  async function send() {
    setBusy("send"); setToast("");
    try {
      const res = await fetch(`/api/books/quotes/${params.id}/send`, { method: "POST" });
      const d = await res.json();
      if (res.ok) { setToast(`Sent to ${d.to}`); load(); } else setToast(d.error || "Could not send");
    } catch { setToast("Network error"); } finally { setBusy(null); }
  }
  function copyLink() { navigator.clipboard?.writeText(viewUrl).then(() => setToast("Quote link copied")); }
  function openPdf() { window.open(`/api/books/quotes/${params.id}/pdf`, "_blank"); }
  function openEdit() { if (q) setEdit({ status: q.status, validUntil: q.validRaw || "", notes: q.notes || "" }); }
  async function saveEdit() {
    if (!edit) return;
    setBusy("editsave");
    try {
      const res = await fetch(`/api/books/quotes/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: edit.status, validUntil: edit.validUntil || null, notes: edit.notes }) });
      if (res.ok) { setEdit(null); setToast("Saved"); load(); } else { const j = await res.json().catch(() => ({})); setToast(j.error || "Could not save"); }
    } finally { setBusy(null); }
  }
  async function convert() {
    if (!q || !confirm(`Convert ${q.number} to an invoice? The quote will be marked accepted.`)) return;
    setBusy("convert"); setToast("");
    try {
      const res = await fetch(`/api/books/quotes/${params.id}/convert`, { method: "POST" });
      const d = await res.json();
      if (res.ok) { window.location.href = `/invoices/${d.invoiceId}`; }
      else { setToast(d.error || "Could not convert"); if (d.invoiceId) window.location.href = `/invoices/${d.invoiceId}`; }
    } catch { setToast("Network error"); } finally { setBusy(null); }
  }
  async function duplicate() {
    setBusy("dup"); setToast("");
    try {
      const res = await fetch(`/api/books/quotes/${params.id}/duplicate`, { method: "POST" });
      const d = await res.json();
      if (res.ok) { window.location.href = `/quotations/${d.id}`; } else setToast(d.error || "Could not duplicate");
    } catch { setToast("Network error"); } finally { setBusy(null); }
  }
  async function del() {
    if (!q || !confirm(`Delete draft ${q.number}? This can't be undone.`)) return;
    setBusy("del"); setToast("");
    try {
      const res = await fetch(`/api/books/quotes/${params.id}`, { method: "DELETE" });
      if (res.ok) { window.location.href = "/quotations"; } else { const j = await res.json().catch(() => ({})); setToast(j.error || "Could not delete"); }
    } catch { setToast("Network error"); } finally { setBusy(null); }
  }

  if (loading) return <AppShell active="quotations"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!q) return <AppShell active="quotations"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Quote not found. <a href="/quotations" style={{ color: color.brand.primary }}>Back to quotes</a></div></AppShell>;

  const expired = ["SENT", "DRAFT"].includes(q.status) && !!q.validRaw && new Date(q.validRaw).getTime() < Date.now();
  const isDraft = q.status === "DRAFT";
  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, marginBottom: 12 };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
  const th: React.CSSProperties = { padding: "9px 16px", fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: color.ink.mid, textTransform: "uppercase", background: color.surface.page, borderBottom: `1px solid ${color.line.strong}` };
  const td: React.CSSProperties = { padding: "11px 16px", fontSize: 13, color: color.ink.DEFAULT, borderBottom: `1px solid ${color.line.DEFAULT}`, verticalAlign: "top" };

  return (
    <AppShell active="quotations">
      <PageTitleRow title={`Quote ${q.number}`} breadcrumb="Books · Quotations"
        badge={<StatusBadge tone={expired ? "critical" : TONE[q.status] ?? "neutral"} label={expired ? "expired" : q.status.toLowerCase()} />}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AskAiButton label="Ask AI" seed={`Write a friendly follow-up email for quote ${q.number} to ${q.customer || "the customer"} (total ${aed(q.total, q.currency)}), encouraging them to accept.`} />
          <Button onClick={() => { window.location.href = "/quotations/" + params.id + "/edit"; }}>Edit items</Button>
          <Button onClick={openEdit}>Status / notes</Button>
          <Button onClick={openPdf}>Download PDF</Button>
          <Button onClick={copyLink}>Copy link</Button>
          <Button onClick={duplicate} disabled={busy === "dup"}>{busy === "dup" ? "Duplicating…" : "Duplicate"}</Button>
          {q.converted ? (
            <Button onClick={() => { window.location.href = `/invoices/${q.invoiceId}`; }}>View invoice{q.invoiceNumber ? ` ${q.invoiceNumber}` : ""}</Button>
          ) : (
            <Button onClick={convert} disabled={busy === "convert"}>{busy === "convert" ? "Converting…" : "Convert to invoice"}</Button>
          )}
          {isDraft ? <Button onClick={del} disabled={busy === "del"}>{busy === "del" ? "Deleting…" : "Delete"}</Button> : null}
          <Button variant="primary" onClick={send} disabled={busy === "send"}>{busy === "send" ? "Sending…" : q.sentAt ? "Resend" : "Send to customer"}</Button>
        </div>} />

      {toast ? <div style={{ background: `color-mix(in srgb, ${color.brand.primary} 10%, ${color.surface.card})`, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 9, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{toast}</div> : null}

      {q.converted ? <div style={{ background: `color-mix(in srgb, ${color.status.positive} 10%, ${color.surface.card})`, border: `1px solid ${color.status.positive}`, color: color.status.positive, borderRadius: 9, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>Converted to invoice {q.invoiceNumber || ""}. <a href={`/invoices/${q.invoiceId}`} style={{ color: "inherit", fontWeight: 600 }}>Open invoice →</a></div> : null}

      {/* Fiori object-page header band */}
      <Panel style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, padding: "18px 20px", borderBottom: `1px solid ${color.line.DEFAULT}`, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 4 }}>Quote for</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>{q.customer || "—"}</div>
            <div style={{ fontSize: 12.5, color: color.ink.mid }}>{q.customerEmail || "No email on file"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: color.ink.soft, marginBottom: 2 }}>Quote total</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: color.ink.DEFAULT, lineHeight: 1.1 }}>{aed(q.total, q.currency)}</div>
          </div>
        </div>
        <PanelBody>
          <FactStrip facts={[
            { label: "Issued", value: q.issued || "—" },
            { label: "Valid until", value: q.valid || "—", tone: expired ? "negative" : "default" },
            { label: "Subtotal", value: aed(q.subtotal, q.currency) },
            { label: "VAT", value: aed(q.vatTotal, q.currency) },
          ]} />
        </PanelBody>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Line items" subtitle={`${lines.length} ${lines.length === 1 ? "item" : "items"}`}
            actions={<Button onClick={() => { window.location.href = "/quotations/" + params.id + "/edit"; }}>Edit items</Button>} />
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
                    <td style={{ ...td, textAlign: "right", color: color.ink.mid }}>{aed(l.unitPrice, q.currency)}</td>
                    <td style={{ ...td, textAlign: "right", color: color.ink.soft }}>{l.vatRate != null ? `${Number(l.vatRate)}%` : "—"}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{aed(l.lineTotal, q.currency)}</td>
                  </tr>
                ))}
                {lines.length === 0 ? <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>No line items — <a href={`/quotations/${params.id}/edit`} style={{ color: color.brand.primary }}>add from catalog</a></td></tr> : null}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px", borderTop: `1px solid ${color.line.DEFAULT}` }}>
              <div style={{ width: 260 }}>
                <Row k="Subtotal" v={aed(q.subtotal, q.currency)} />
                <Row k="VAT" v={aed(q.vatTotal, q.currency)} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, padding: "8px 0", borderTop: `2px solid ${color.ink.DEFAULT}`, marginTop: 4, color: color.ink.DEFAULT }}><span>Total</span><span>{aed(q.total, q.currency)}</span></div>
              </div>
            </div>
            {q.notes ? <div style={{ padding: "14px 16px", fontSize: 12.5, color: color.ink.mid, borderTop: `1px solid ${color.line.DEFAULT}`, background: color.surface.page }}><b style={{ color: color.ink.DEFAULT }}>Notes</b><br />{q.notes}</div> : null}
          </PanelBody>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <PanelHeader title="Customer" />
            <PanelBody>
              <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{q.customer || "—"}</div>
              <div style={{ fontSize: 13, color: color.ink.mid }}>{q.customerEmail || "No email on file"}</div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Share link" />
            <PanelBody>
              <div style={{ fontSize: 12, color: color.ink.soft, wordBreak: "break-all", background: color.surface.sunken, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>{viewUrl}</div>
              <div style={{ display: "flex", gap: 8 }}><Button onClick={copyLink}>Copy link</Button><a href={viewUrl} target="_blank" rel="noreferrer"><Button>Open</Button></a></div>
              <p style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 14, lineHeight: 1.5 }}>“Send to customer” emails a branded quote with an <b>Accept online</b> button. The customer can accept directly from the share link.</p>
            </PanelBody>
          </Panel>
          <AttachmentsPanel docType="QUOTE" docId={params.id} />
        </div>
      </div>

      {edit ? (
        <div onClick={() => busy !== "editsave" && setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Quick edit — status, valid-until & note</h2>
              <button aria-label="Close" onClick={() => setEdit(null)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <label style={lbl}>Status</label>
            <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} style={fieldS}>{STATUSES.map((st) => <option key={st} value={st}>{st.toLowerCase()}</option>)}</select>
            <label style={lbl}>Valid until</label>
            <input type="date" value={edit.validUntil} onChange={(e) => setEdit({ ...edit, validUntil: e.target.value })} style={fieldS} />
            <label style={lbl}>Notes</label>
            <textarea value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={3} style={{ ...fieldS, height: "auto", padding: 11, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setEdit(null)} disabled={busy === "editsave"}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit} disabled={busy === "editsave"}>{busy === "editsave" ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
