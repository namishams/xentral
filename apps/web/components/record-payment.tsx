"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { Button } from "@xentral/ui";

type Inv = { id: string; number: string; customer: string; total: number; amountPaid: number };
const METHODS = [["BANK_TRANSFER", "Bank transfer"], ["CASH", "Cash"], ["CARD", "Card"], ["CHEQUE", "Cheque"], ["ONLINE", "Online"]] as const;
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", marginBottom: 12 };

export function RecordPaymentButton({ label = "+ Record payment" }: { label?: string }) {
  const [open, setOpen] = React.useState(false);
  const [invoices, setInvoices] = React.useState<Inv[]>([]);
  const [invoiceId, setInvoiceId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("BANK_TRANSFER");
  const [reference, setReference] = React.useState("");
  const [date, setDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    fetch("/api/books/invoices").then((r) => r.json()).then((d) => {
      const rows: Inv[] = (d.rows ?? []).filter((r: Inv) => (Number(r.total) || 0) - (Number(r.amountPaid) || 0) > 0.005);
      setInvoices(rows);
      if (rows.length) { setInvoiceId(rows[0]!.id); setAmount(((Number(rows[0]!.total) || 0) - (Number(rows[0]!.amountPaid) || 0)).toFixed(2)); }
    }).catch(() => {});
  }, [open]);

  function pick(id: string) {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) setAmount(((Number(inv.total) || 0) - (Number(inv.amountPaid) || 0)).toFixed(2));
  }
  function reset() { setOpen(false); setErr(""); setReference(""); setDate(""); }

  async function save() {
    const amt = parseFloat(amount) || 0;
    if (!invoiceId || amt <= 0) { setErr("Pick an invoice and enter an amount"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/books/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId, amount: amt, method, reference, paidAt: date || null }) });
      if (res.ok) { reset(); window.location.reload(); }
      else { const j = await res.json().catch(() => ({})); setErr(j.error || "Could not record"); setSaving(false); }
    } catch { setErr("Network error"); setSaving(false); }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>{label}</Button>
      {open ? (
        <div onClick={() => !saving && reset()} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Record payment</h2>
              <button aria-label="Close" onClick={reset} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            {err ? <div style={{ background: `color-mix(in srgb, ${color.status.critical} 12%, ${color.surface.card})`, color: color.status.critical, border: `1px solid ${color.status.critical}`, borderRadius: 8, padding: "8px 11px", fontSize: 12.5, marginBottom: 12 }}>{err}</div> : null}
            <label style={lbl}>Invoice</label>
            {invoices.length === 0 ? (
              <div style={{ fontSize: 13, color: color.ink.mid, marginBottom: 12 }}>No outstanding invoices.</div>
            ) : (
              <select value={invoiceId} onChange={(e) => pick(e.target.value)} style={inp}>
                {invoices.map((i) => { const bal = (Number(i.total) || 0) - (Number(i.amountPaid) || 0); return <option key={i.id} value={i.id}>{i.number} · {i.customer || "—"} · AED {bal.toLocaleString()}</option>; })}
              </select>
            )}
            <label style={lbl}>Amount (AED)</label>
            <input value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value)} style={inp} />
            <label style={lbl}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inp}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <label style={lbl}>Reference</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn / cheque no." style={inp} />
            <label style={lbl}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <Button onClick={reset} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={saving || invoices.length === 0}>{saving ? "Saving…" : "Record payment"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
