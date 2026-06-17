"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, type BadgeTone } from "@xentral/ui";

type Line = { name: string; description: string | null; qty: number; unitPrice: number; lineTotal: number };
type Q = { id: string; number: string; status: string; total: number; subtotal: number; vatTotal: number; currency: string; issued: string | null; valid: string | null; notes: string | null; token: string; customer: string; customerEmail: string | null };
const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", ACCEPTED: "positive", REJECTED: "critical", EXPIRED: "neutral", INVOICED: "positive" };

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const [q, setQ] = React.useState<Q | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const load = React.useCallback(() => {
    fetch(`/api/books/quotes/${params.id}`).then((r) => r.json()).then((d) => { setQ(d.quote ?? null); setLines(d.lines ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  const viewUrl = q && typeof window !== "undefined" ? `${window.location.origin}/q/${q.token}` : "";

  async function send() {
    setBusy(true); setToast("");
    try {
      const res = await fetch(`/api/books/quotes/${params.id}/send`, { method: "POST" });
      const d = await res.json();
      if (res.ok) { setToast(`Sent to ${d.to}`); load(); } else setToast(d.error || "Could not send");
    } catch { setToast("Network error"); } finally { setBusy(false); }
  }
  function copyLink() { navigator.clipboard?.writeText(viewUrl).then(() => setToast("Quote link copied")); }

  if (loading) return <AppShell active="quotations"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!q) return <AppShell active="quotations"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Quote not found. <a href="/quotations" style={{ color: color.brand.primary }}>Back to quotes</a></div></AppShell>;

  return (
    <AppShell active="quotations">
      <PageTitleRow title={`Quote ${q.number}`} subtitle={`${q.customer || "—"}${q.issued ? ` · issued ${q.issued}` : ""}`}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button onClick={copyLink}>Copy link</Button>
          <a href={viewUrl} target="_blank" rel="noreferrer"><Button>Open quote page</Button></a>
          <Button variant="primary" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send to customer"}</Button>
        </div>} />

      {toast ? <div style={{ background: `color-mix(in srgb, ${color.brand.primary} 10%, ${color.surface.card})`, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 9, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{toast}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <StatusBadge tone={TONE[q.status] ?? "neutral"} label={q.status.toLowerCase()} />
            <span style={{ fontSize: 12.5, color: color.ink.soft }}>{q.valid ? `Valid until ${q.valid}` : ""}</span>
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
                  <td style={{ textAlign: "right", color: color.ink.mid }}>{aed(l.unitPrice, q.currency)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{aed(l.lineTotal, q.currency)}</td>
                </tr>
              ))}
              {lines.length === 0 ? <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: color.ink.soft }}>No line items</td></tr> : null}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <div style={{ width: 220 }}>
              <Row k="Subtotal" v={aed(q.subtotal, q.currency)} />
              <Row k="VAT" v={aed(q.vatTotal, q.currency)} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, padding: "8px 0", borderTop: `2px solid ${color.ink.DEFAULT}`, color: color.ink.DEFAULT }}><span>Total</span><span>{aed(q.total, q.currency)}</span></div>
            </div>
          </div>
          {q.notes ? <div style={{ marginTop: 16, fontSize: 12.5, color: color.ink.mid, borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12 }}>{q.notes}</div> : null}
        </section>

        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Customer</h2>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{q.customer || "—"}</div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 16 }}>{q.customerEmail || "No email on file"}</div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 8px" }}>Shareable quote link</h2>
          <div style={{ fontSize: 12, color: color.ink.soft, wordBreak: "break-all", background: color.surface.sunken, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>{viewUrl}</div>
          <Button onClick={copyLink}>Copy link</Button>
          <p style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 14, lineHeight: 1.5 }}>“Send to customer” emails a branded quote with a public <b>Accept / Decline</b> page. Accepting marks the quote as accepted automatically.</p>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>;
}
