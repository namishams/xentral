"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone } from "@xentral/ui";

type Line = { name: string; description: string | null; qty: number; unitPrice: number; vatRate: number; lineTotal: number };
type Inv = { id: string; number: string; status: string; total: number; amountPaid: number; subtotal: number; vatTotal: number; currency: string; issued: string | null; due: string | null; notes: string | null; customer: string; customerEmail: string | null };
const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral", OVERDUE: "critical" };

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [inv, setInv] = React.useState<Inv | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const load = React.useCallback(() => {
    fetch(`/api/books/invoices/${params.id}`).then((r) => r.json()).then((d) => { setInv(d.invoice ?? null); setLines(d.lines ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const payUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${params.id}` : "";

  async function send() {
    setBusy(true); setToast("");
    try {
      const res = await fetch(`/api/books/invoices/${params.id}/send`, { method: "POST" });
      const d = await res.json();
      if (res.ok) { setToast(`Sent to ${d.to}`); load(); } else setToast(d.error || "Could not send");
    } catch { setToast("Network error"); } finally { setBusy(false); }
  }
  function copyLink() { navigator.clipboard?.writeText(payUrl).then(() => setToast("Pay link copied")); }

  if (loading) return <AppShell active="invoice"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!inv) return <AppShell active="invoice"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Invoice not found. <a href="/invoices" style={{ color: color.brand.primary }}>Back to invoices</a></div></AppShell>;

  const bal = Math.max(0, (inv.total || 0) - (inv.amountPaid || 0));

  return (
    <AppShell active="invoice">
      <PageTitleRow title={`Invoice ${inv.number}`} subtitle={`${inv.customer || "—"}${inv.issued ? ` · issued ${inv.issued}` : ""}`}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button onClick={copyLink}>Copy pay link</Button>
          <a href={payUrl} target="_blank" rel="noreferrer"><Button>Open pay page</Button></a>
          <Button variant="primary" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send to customer"}</Button>
        </div>} />

      {toast ? <div style={{ background: `color-mix(in srgb, ${color.brand.primary} 10%, ${color.surface.card})`, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 9, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{toast}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <StatusBadge tone={TONE[inv.status] ?? "neutral"} label={inv.status.replace("_", " ").toLowerCase()} />
            <span style={{ fontSize: 12.5, color: color.ink.soft }}>{inv.due ? `Due ${inv.due}` : ""}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1px solid ${color.line.DEFAULT}`, color: color.ink.soft, textAlign: "left" }}>
              <th style={{ padding: "7px 0", fontWeight: 700 }}>Item</th><th style={{ textAlign: "right", fontWeight: 700 }}>Qty</th><th style={{ textAlign: "right", fontWeight: 700 }}>Price</th><th style={{ textAlign: "right", fontWeight: 700 }}>Amount</th>
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                  <td style={{ padding: "9px 0", color: color.ink.DEFAULT }}>{l.name}{l.description ? <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{l.description}</span> : null}</td>
                  <td style={{ textAlign: "right", color: color.ink.mid }}>{Number(l.qty)}</td>
                  <td style={{ textAlign: "right", color: color.ink.mid }}>{aed(l.unitPrice, inv.currency)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{aed(l.lineTotal, inv.currency)}</td>
                </tr>
              ))}
              {lines.length === 0 ? <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: color.ink.soft }}>No line items</td></tr> : null}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <div style={{ width: 220 }}>
              <Row k="Subtotal" v={aed(inv.subtotal, inv.currency)} />
              <Row k="VAT" v={aed(inv.vatTotal, inv.currency)} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, padding: "8px 0", borderTop: `2px solid ${color.ink.DEFAULT}`, color: color.ink.DEFAULT }}><span>Total</span><span>{aed(inv.total, inv.currency)}</span></div>
              {inv.amountPaid > 0 ? <Row k="Paid" v={aed(inv.amountPaid, inv.currency)} /> : null}
              {bal > 0 ? <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: color.status.critical, padding: "4px 0" }}><span>Balance due</span><span>{aed(bal, inv.currency)}</span></div> : null}
            </div>
          </div>
          {inv.notes ? <div style={{ marginTop: 16, fontSize: 12.5, color: color.ink.mid, borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12 }}>{inv.notes}</div> : null}
        </section>

        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Customer</h2>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{inv.customer || "—"}</div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 16 }}>{inv.customerEmail || "No email on file"}</div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 8px" }}>Payment link</h2>
          <div style={{ fontSize: 12, color: color.ink.soft, wordBreak: "break-all", background: color.surface.sunken, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>{payUrl}</div>
          <Button onClick={copyLink}>Copy link</Button>
          <p style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 14, lineHeight: 1.5 }}>“Send to customer” emails a branded invoice with a secure <b>Pay with Telr</b> button. Paying marks this invoice as paid automatically.</p>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
