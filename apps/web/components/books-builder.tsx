"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input } from "@xentral/ui";

type Kind = "invoice" | "quote";
type Line = { name: string; qty: string; unitPrice: string; vatRate: string; discountPct: string };
type Customer = { id: string; name: string; email: string | null };

const blankLine = (): Line => ({ name: "", qty: "1", unitPrice: "", vatRate: "5", discountPct: "0" });
const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CFG = {
  invoice: { active: "invoice", title: "invoice", api: "/api/books/invoices", list: "/invoices", dateLabel: "Due date", dateKey: "dueDate", detailKey: "invoice", dateRaw: "dueDateRaw" },
  quote: { active: "quotations", title: "quote", api: "/api/books/quotes", list: "/quotations", dateLabel: "Valid until", dateKey: "validUntil", detailKey: "quote", dateRaw: "validRaw" },
} as const;

const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const cell: React.CSSProperties = { height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 7, padding: "0 9px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box", width: "100%" };

export function BooksBuilder({ kind, editId }: { kind: Kind; editId?: string }) {
  const cfg = CFG[kind];
  const editing = !!editId;
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [mode, setMode] = React.useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerLabel, setCustomerLabel] = React.useState("");
  const [date, setDate] = React.useState("");
  const [currency, setCurrency] = React.useState("AED");
  const [notes, setNotes] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([blankLine()]);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(editing);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (editing) {
      fetch(`${cfg.api}/${editId}`).then((r) => r.json()).then((d) => {
        const doc = d[cfg.detailKey] || {};
        setCustomerLabel(doc.customer || "Customer");
        setCurrency(doc.currency || "AED");
        setNotes(doc.notes || "");
        setDate(doc[cfg.dateRaw] || "");
        const ls = (d.lines || []).map((l: Record<string, unknown>) => ({ name: String(l.name ?? ""), qty: String(Number(l.qty) || 0), unitPrice: String(Number(l.unitPrice) || 0), vatRate: String(l.vatRate == null ? 5 : Number(l.vatRate)), discountPct: String(Number(l.discountPct) || 0) }));
        setLines(ls.length ? ls : [blankLine()]);
        setLoading(false);
      }).catch(() => { setErr("Could not load"); setLoading(false); });
      return;
    }
    fetch("/api/books/customers").then((r) => r.json()).then((d) => {
      const rows: Customer[] = d.rows ?? [];
      setCustomers(rows);
      if (rows.length === 0) setMode("new"); else setCustomerId(rows[0]!.id);
    }).catch(() => setMode("new"));
  }, [editing, editId, cfg.api, cfg.detailKey, cfg.dateRaw]);

  const totals = React.useMemo(() => {
    let sub = 0, vat = 0;
    for (const l of lines) {
      const qty = parseFloat(l.qty) || 0, up = parseFloat(l.unitPrice) || 0, disc = parseFloat(l.discountPct) || 0, vr = parseFloat(l.vatRate) || 0;
      const net = qty * up * (1 - disc / 100); sub += net; vat += net * vr / 100;
    }
    return { sub, vat, total: sub + vat };
  }, [lines]);

  function setLine(i: number, patch: Partial<Line>) { setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l))); }
  function addLine() { setLines((ls) => [...ls, blankLine()]); }
  function removeLine(i: number) { setLines((ls) => (ls.length > 1 ? ls.filter((_, k) => k !== i) : ls)); }

  const hasCustomer = editing || (mode === "existing" ? !!customerId : !!customerName.trim());
  const hasLine = lines.some((l) => l.name.trim() || (parseFloat(l.unitPrice) || 0) > 0);
  const canSave = hasCustomer && hasLine && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true); setErr("");
    const linePayload = lines.map((l) => ({ name: l.name, qty: parseFloat(l.qty) || 0, unitPrice: parseFloat(l.unitPrice) || 0, vatRate: parseFloat(l.vatRate) || 0, discountPct: parseFloat(l.discountPct) || 0 }));
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`${cfg.api}/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes, [cfg.dateKey]: date || null, lines: linePayload }) });
      } else {
        const payload: Record<string, unknown> = { currency, notes, [cfg.dateKey]: date || null, lines: linePayload };
        if (mode === "existing") payload.customerId = customerId; else payload.customerName = customerName.trim();
        res = await fetch(cfg.api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      if (res.ok) { window.location.href = editing ? `${cfg.list}/${editId}` : cfg.list; }
      else { const j = await res.json().catch(() => ({})); setErr(j.error || "Could not save"); setSaving(false); }
    } catch { setErr("Network error"); setSaving(false); }
  }

  const cancelHref = editing ? `${cfg.list}/${editId}` : cfg.list;

  if (loading) return <AppShell active={cfg.active}><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;

  return (
    <AppShell active={cfg.active}>
      <PageTitleRow title={editing ? `Edit ${cfg.title}` : `New ${cfg.title}`} subtitle={editing ? "Update line items, dates and notes" : "Build a draft, then send or convert later"}
        actions={<div style={{ display: "flex", gap: 8 }}><Button onClick={() => { window.location.href = cancelHref; }}>Cancel</Button><Button variant="primary" onClick={save} disabled={!canSave}>{saving ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button></div>} />

      {err ? <div style={{ background: `color-mix(in srgb, ${color.status.critical} 12%, ${color.surface.card})`, color: color.status.critical, border: `1px solid ${color.status.critical}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16, marginBottom: 16 }}>
        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Customer</h2>
          {editing ? (
            <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{customerLabel}<span style={{ display: "block", fontSize: 12, fontWeight: 400, color: color.ink.soft }}>Customer can't be changed while editing.</span></div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: color.ink.mid, cursor: "pointer" }}><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} disabled={customers.length === 0} /> Existing</label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: color.ink.mid, cursor: "pointer" }}><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> New</label>
              </div>
              {mode === "existing" ? (
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ ...cell, height: 38 }}>
                  {customers.length === 0 ? <option value="">No customers yet</option> : null}
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ""}</option>)}
                </select>
              ) : (
                <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: "100%" }} />
              )}
            </>
          )}
        </section>
        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Details</h2>
          <label style={lbl}>{cfg.dateLabel}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...cell, height: 38, marginBottom: 12 }} />
          <label style={lbl}>Currency</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={editing} style={{ ...cell, height: 38 }} />
        </section>
      </div>

      <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Line items</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 70px 70px 110px 30px", gap: 8, fontSize: 11, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.3, padding: "0 2px 6px" }}>
          <span>Description</span><span>Qty</span><span>Unit price</span><span>VAT %</span><span>Disc %</span><span style={{ textAlign: "right" }}>Amount</span><span />
        </div>
        {lines.map((l, i) => {
          const qty = parseFloat(l.qty) || 0, up = parseFloat(l.unitPrice) || 0, disc = parseFloat(l.discountPct) || 0;
          const net = qty * up * (1 - disc / 100);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 70px 70px 110px 30px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input value={l.name} placeholder="Item or service" onChange={(e) => setLine(i, { name: e.target.value })} style={cell} />
              <input value={l.qty} inputMode="decimal" onChange={(e) => setLine(i, { qty: e.target.value })} style={cell} />
              <input value={l.unitPrice} inputMode="decimal" placeholder="0.00" onChange={(e) => setLine(i, { unitPrice: e.target.value })} style={cell} />
              <input value={l.vatRate} inputMode="decimal" onChange={(e) => setLine(i, { vatRate: e.target.value })} style={cell} />
              <input value={l.discountPct} inputMode="decimal" onChange={(e) => setLine(i, { discountPct: e.target.value })} style={cell} />
              <span style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <button aria-label="Remove line" onClick={() => removeLine(i)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
          );
        })}
        <div style={{ marginTop: 4 }}><Button onClick={addLine}>+ Add line</Button></div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16 }}>
        <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
          <label style={lbl}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes shown on the document" style={{ ...cell, height: "auto", padding: 9, resize: "vertical" }} />
        </section>
        <section style={{ background: color.surface.sunken, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, marginBottom: 8 }}><span>Subtotal</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(totals.sub)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, marginBottom: 8 }}><span>VAT</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(totals.vat)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 10 }}><span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(totals.total)}</span></div>
          <div style={{ marginTop: 14 }}><Button variant="primary" onClick={save} disabled={!canSave}>{saving ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button></div>
        </section>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>{editing ? `Editing ${cfg.title}` : `${cfg.title} · saves a DRAFT`} · tenant-scoped</p>
    </AppShell>
  );
}
