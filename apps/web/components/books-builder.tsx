"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input } from "@xentral/ui";

type Kind = "invoice" | "quote";
type Line = { name: string; qty: string; unitPrice: string; vatRate: string; discountPct: string };
type Customer = { id: string; name: string; email: string | null };
type Item = { id: string; name: string; description: string; unitPrice: number | string; vatRate: number | string; kind?: string };
type Owner = { id: string; name: string };

const blankLine = (): Line => ({ name: "", qty: "1", unitPrice: "", vatRate: "5", discountPct: "0" });
const aed = (n: number, c = "AED") => `${c} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CFG = {
  invoice: { active: "invoice", title: "invoice", noun: "Invoice", api: "/api/books/invoices", list: "/invoices", dateLabel: "Due date", dateKey: "dueDate", detailKey: "invoice", dateRaw: "dueDateRaw" },
  quote: { active: "quotations", title: "quote", noun: "Offer", api: "/api/books/quotes", list: "/quotations", dateLabel: "Valid until", dateKey: "validUntil", detailKey: "quote", dateRaw: "validRaw" },
} as const;

const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const cell: React.CSSProperties = { height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 7, padding: "0 9px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box", width: "100%" };
const cardS: React.CSSProperties = { background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" };

export function BooksBuilder({ kind, editId }: { kind: Kind; editId?: string }) {
  const cfg = CFG[kind];
  const editing = !!editId;
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [owners, setOwners] = React.useState<Owner[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [picker, setPicker] = React.useState(false);
  const [pq, setPq] = React.useState("");
  const [mode, setMode] = React.useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [issueDate, setIssueDate] = React.useState("");
  const [date, setDate] = React.useState("");
  const [currency, setCurrency] = React.useState("AED");
  const [referenceNo, setReferenceNo] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [salespersonId, setSalespersonId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([blankLine()]);
  const [saving, setSaving] = React.useState("");
  const [loading, setLoading] = React.useState(editing);
  const [err, setErr] = React.useState("");

  React.useEffect(() => { fetch("/api/books/items").then((r) => r.json()).then((d) => setItems(d.rows ?? [])).catch(() => {}); }, []);
  React.useEffect(() => { fetch("/api/books/owners").then((r) => r.json()).then((d) => setOwners(d.rows ?? [])).catch(() => {}); }, []);
  React.useEffect(() => { fetch("/api/books/customers").then((r) => r.json()).then((d) => setCustomers(d.rows ?? [])).catch(() => {}); }, []);

  React.useEffect(() => {
    if (editing) {
      fetch(`${cfg.api}/${editId}`).then((r) => r.json()).then((d) => {
        const doc = d[cfg.detailKey] || {};
        setCustomerId(doc.customerId || "");
        setCustomerName(doc.customer || "");
        setMode("existing");
        setCurrency(doc.currency || "AED");
        setIssueDate(doc.issueDateRaw || "");
        setDate(doc[cfg.dateRaw] || "");
        setReferenceNo(doc.referenceNo || "");
        setProjectName(doc.projectName || "");
        setSalespersonId(doc.salespersonId || "");
        setNotes(doc.notes || "");
        const ls = (d.lines || []).map((l: Record<string, unknown>) => ({ name: String(l.name ?? ""), qty: String(Number(l.qty) || 0), unitPrice: String(Number(l.unitPrice) || 0), vatRate: String(l.vatRate == null ? 5 : Number(l.vatRate)), discountPct: String(Number(l.discountPct) || 0) }));
        setLines(ls.length ? ls : [blankLine()]);
        setLoading(false);
      }).catch(() => { setErr("Could not load"); setLoading(false); });
    }
  }, [editing, editId, cfg.api, cfg.detailKey, cfg.dateRaw]);

  React.useEffect(() => { if (!editing && customers.length && !customerId) setCustomerId(customers[0]!.id); }, [customers, editing, customerId]);

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
  function moveLine(i: number, dir: -1 | 1) { setLines((ls) => { const j = i + dir; if (j < 0 || j >= ls.length) return ls; const n = [...ls]; const t = n[i]!; n[i] = n[j]!; n[j] = t; return n; }); }
  function addFromCatalog(it: Item) {
    const line: Line = { name: it.name, qty: "1", unitPrice: String(Number(it.unitPrice) || 0), vatRate: String(Number(it.vatRate) || 5), discountPct: "0" };
    setLines((ls) => { const empty = ls.findIndex((l) => !l.name.trim() && !parseFloat(l.unitPrice)); if (empty >= 0) { const n = [...ls]; n[empty] = line; return n; } return [...ls, line]; });
  }

  const hasCustomer = mode === "existing" ? !!customerId : !!customerName.trim();
  const hasLine = lines.some((l) => l.name.trim() || (parseFloat(l.unitPrice) || 0) > 0);
  const canSave = hasCustomer && hasLine && !saving;

  async function save(send: boolean) {
    if (!canSave) return;
    setSaving(send ? "send" : "save"); setErr("");
    const linePayload = lines.map((l) => ({ name: l.name, qty: parseFloat(l.qty) || 0, unitPrice: parseFloat(l.unitPrice) || 0, vatRate: parseFloat(l.vatRate) || 0, discountPct: parseFloat(l.discountPct) || 0 }));
    const body: Record<string, unknown> = {
      currency, notes, issueDate: issueDate || null, [cfg.dateKey]: date || null,
      referenceNo: referenceNo || null, projectName: projectName || null, salespersonId: salespersonId || null,
      lines: linePayload,
    };
    if (mode === "existing") body.customerId = customerId; else body.customerName = customerName.trim();
    try {
      let res: Response; let docId = editId;
      if (editing) {
        res = await fetch(`${cfg.api}/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        res = await fetch(cfg.api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.error || "Could not save"); setSaving(""); return; }
      if (!editing) { const j = await res.json().catch(() => ({})); docId = j.id; }
      if (send && docId) { await fetch(`${cfg.api}/${docId}/send`, { method: "POST" }).catch(() => {}); }
      window.location.href = docId ? `${cfg.list}/${docId}` : cfg.list;
    } catch { setErr("Network error"); setSaving(""); }
  }

  const cancelHref = editing ? `${cfg.list}/${editId}` : cfg.list;
  const filteredItems = items.filter((it) => (it.name + " " + it.description).toLowerCase().includes(pq.toLowerCase()));

  if (loading) return <AppShell active={cfg.active}><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;

  return (
    <AppShell active={cfg.active}>
      <PageTitleRow title={editing ? `Edit ${cfg.noun.toLowerCase()}` : `New ${cfg.noun.toLowerCase()}`} breadcrumb={`Books · ${cfg.title === "quote" ? "Quotations" : "Invoices"}`}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => { window.location.href = cancelHref; }}>Cancel</Button>
          <Button onClick={() => save(true)} disabled={!canSave}>{saving === "send" ? "Sending…" : "Save & Send"}</Button>
          <Button variant="primary" onClick={() => save(false)} disabled={!canSave}>{saving === "save" ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button>
        </div>} />

      {err ? <div style={{ background: `color-mix(in srgb, ${color.status.critical} 12%, ${color.surface.card})`, color: color.status.critical, border: `1px solid ${color.status.critical}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2.4fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <div>
          {/* Customer + details */}
          <section style={{ ...cardS, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Customer *</label>
                {mode === "existing" ? (
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ ...cell, height: 38 }}>
                    {customers.length === 0 ? <option value="">No customers yet</option> : null}
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ""}</option>)}
                  </select>
                ) : (
                  <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: "100%" }} />
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: color.ink.mid, cursor: "pointer" }}><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Existing</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: color.ink.mid, cursor: "pointer" }}><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> New</label>
                  <span style={{ fontSize: 11.5, color: color.ink.soft, alignSelf: "center" }}>pick from CRM-synced list — no duplicate entry.</span>
                </div>
              </div>
              <div>
                <label style={lbl}>{cfg.noun} date</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={{ ...cell, height: 38 }} />
              </div>
              <div>
                <label style={lbl}>{cfg.dateLabel}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...cell, height: 38 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <label style={lbl}>Currency</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...cell, height: 38 }} />
              </div>
              <div>
                <label style={lbl}>Reference #</label>
                <Input placeholder="PO / internal ref" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={lbl}>Salesperson</label>
                <select value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)} style={{ ...cell, height: 38 }}>
                  <option value="">Unassigned</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Project name</label>
                <Input placeholder="Optional" value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ width: "100%" }} />
              </div>
            </div>
          </section>

          {/* Line items */}
          <section style={{ ...cardS, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Line items</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => { setPq(""); setPicker(true); }}>≣ Add from catalog</Button>
                <Button variant="primary" onClick={addLine}>+ Add line</Button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 110px 64px 64px 110px 56px", gap: 8, fontSize: 10.5, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.3, padding: "0 2px 6px" }}>
              <span>Item</span><span>Qty</span><span>Unit price</span><span>VAT %</span><span>Disc %</span><span style={{ textAlign: "right" }}>Amount</span><span />
            </div>
            {lines.map((l, i) => {
              const qty = parseFloat(l.qty) || 0, up = parseFloat(l.unitPrice) || 0, disc = parseFloat(l.discountPct) || 0;
              const net = qty * up * (1 - disc / 100);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 64px 110px 64px 64px 110px 56px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input value={l.name} placeholder="Item or service" onChange={(e) => setLine(i, { name: e.target.value })} style={cell} />
                  <input value={l.qty} inputMode="decimal" onChange={(e) => setLine(i, { qty: e.target.value })} style={cell} />
                  <input value={l.unitPrice} inputMode="decimal" placeholder="0.00" onChange={(e) => setLine(i, { unitPrice: e.target.value })} style={cell} />
                  <input value={l.vatRate} inputMode="decimal" onChange={(e) => setLine(i, { vatRate: e.target.value })} style={cell} />
                  <input value={l.discountPct} inputMode="decimal" onChange={(e) => setLine(i, { discountPct: e.target.value })} style={cell} />
                  <span style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span style={{ display: "inline-flex", gap: 2, justifyContent: "flex-end" }}>
                    <button aria-label="Move up" onClick={() => moveLine(i, -1)} style={{ width: 22, height: 28, borderRadius: 6, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer", fontSize: 10 }}>▲</button>
                    <button aria-label="Remove line" onClick={() => removeLine(i)} style={{ width: 24, height: 28, borderRadius: 6, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer" }}>×</button>
                  </span>
                </div>
              );
            })}
          </section>

          {/* Notes */}
          <section style={cardS}>
            <label style={lbl}>Notes (printed on the document)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Thank you for your business." style={{ ...cell, height: "auto", padding: 9, resize: "vertical" }} />
          </section>
        </div>

        {/* Summary (sticky) */}
        <section style={{ ...cardS, position: "sticky", top: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Summary</h2>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, marginBottom: 8 }}><span>Subtotal</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(totals.sub, currency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: color.ink.mid, marginBottom: 8 }}><span>VAT</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(totals.vat, currency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: color.ink.DEFAULT, borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 10 }}><span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(totals.total, currency)}</span></div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <Button variant="primary" onClick={() => save(false)} disabled={!canSave}>{saving === "save" ? "Saving…" : editing ? "Save changes" : "Save draft"}</Button>
            <Button onClick={() => save(true)} disabled={!canSave}>{saving === "send" ? "Sending…" : "Save & Send"}</Button>
          </div>
          <p style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 12, lineHeight: 1.5 }}>{editing ? "Changes apply immediately." : `Saved as a draft with the next ${cfg.noun.toLowerCase()} number.`} Send it by email with a PDF{kind === "quote" ? " and an online accept link" : " and a pay link"}.</p>
        </section>
      </div>

      {picker ? (
        <div onClick={() => setPicker(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, maxHeight: "80vh", background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT }}>Add from catalog</h2>
              <button aria-label="Close" onClick={() => setPicker(false)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <Input placeholder="Search items…" value={pq} onChange={(e) => setPq(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
            <div style={{ overflowY: "auto", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9 }}>
              {filteredItems.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>{items.length === 0 ? "No catalog items yet. Add some under Products." : "No matches."}</div>
                : filteredItems.map((it) => (
                  <button key={it.id} onClick={() => { addFromCatalog(it); setPicker(false); }} style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 14px", border: 0, borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, cursor: "pointer" }}>
                    <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>{it.description ? <span style={{ display: "block", fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.description}</span> : null}</span>
                    <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: color.brand.primary }}>{aed(Number(it.unitPrice) || 0, currency)}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
