"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Button, Input } from "@xentral/ui";

type Kind = "invoice" | "quote";
type Line = { itemId: string; name: string; qty: string; unitPrice: string; vatRate: string; discountPct: string };
type Customer = { id: string; name: string; email: string | null };
type Item = { id: string; name: string; description: string; unitPrice: number | string; vatRate: number | string };
type Owner = { id: string; name: string };

const blankLine = (vat = "5"): Line => ({ itemId: "", name: "", qty: "1", unitPrice: "", vatRate: vat, discountPct: "0" });
const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CFG = {
  invoice: { active: "invoice", noun: "Invoice", api: "/api/books/invoices", list: "/invoices", dateLabel: "Due date", dateKey: "dueDate", detailKey: "invoice", dateRaw: "dueDateRaw", crumb: "Books · Invoices" },
  quote: { active: "quotations", noun: "Offer", api: "/api/books/quotes", list: "/quotations", dateLabel: "Valid until", dateKey: "validUntil", detailKey: "quote", dateRaw: "validRaw", crumb: "Books · Quotations" },
} as const;

const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const cell: React.CSSProperties = { height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 7, padding: "0 9px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box", width: "100%", fontVariantNumeric: "tabular-nums" };
const cardS: React.CSSProperties = { background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px" };

export function BooksBuilder({ kind, editId }: { kind: Kind; editId?: string }) {
  const cfg = CFG[kind];
  const editing = !!editId;
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [owners, setOwners] = React.useState<Owner[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [settings, setSettings] = React.useState<Record<string, unknown>>({});
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
  const [subject, setSubject] = React.useState("");
  const [terms, setTerms] = React.useState("");
  const [sel, setSel] = React.useState<string[]>([]);
  const [payTerms, setPayTerms] = React.useState("");
  function applyTerms(t: string) { setPayTerms(t); if (t === "") return; const base = issueDate ? new Date(issueDate) : new Date(); base.setDate(base.getDate() + (parseInt(t, 10) || 0)); setDate(base.toISOString().slice(0, 10)); }
  const [lines, setLines] = React.useState<Line[]>([blankLine()]);
  const [saving, setSaving] = React.useState("");
  const [loading, setLoading] = React.useState(editing);
  const [err, setErr] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const aed = (n: number) => `${currency} ${fmt(n)}`;

  React.useEffect(() => { fetch("/api/books/items").then((r) => r.json()).then((d) => setItems(d.rows ?? [])).catch(() => {}); }, []);
  React.useEffect(() => { fetch("/api/books/owners").then((r) => r.json()).then((d) => setOwners(d.rows ?? [])).catch(() => {}); }, []);
  React.useEffect(() => { fetch("/api/books/customers").then((r) => r.json()).then((d) => setCustomers(d.rows ?? [])).catch(() => {}); }, []);
  React.useEffect(() => { fetch("/api/books/settings").then((r) => r.json()).then((d) => { const s = d.settings || {}; setSettings(s); if (!editing) { if (s.currency) setCurrency(s.currency); if (s.defaultVatRate != null) setLines((ls) => ls.map((l) => ({ ...l, vatRate: String(s.defaultVatRate) }))); } }).catch(() => {}); }, [editing]);

  React.useEffect(() => {
    if (editing) {
      fetch(`${cfg.api}/${editId}`).then((r) => r.json()).then((d) => {
        const doc = d[cfg.detailKey] || {};
        setCustomerId(doc.customerId || ""); setCustomerName(doc.customer || ""); setMode("existing");
        setCurrency(doc.currency || "AED"); setIssueDate(doc.issueDateRaw || ""); setDate(doc[cfg.dateRaw] || "");
        setReferenceNo(doc.referenceNo || ""); setProjectName(doc.projectName || ""); setSalespersonId(doc.salespersonId || ""); setNotes(doc.notes || ""); setSubject(doc.subject || ""); setTerms(doc.terms || "");
        const ls = (d.lines || []).map((l: Record<string, unknown>) => ({ itemId: "", name: String(l.name ?? ""), qty: String(Number(l.qty) || 0), unitPrice: String(Number(l.unitPrice) || 0), vatRate: String(l.vatRate == null ? 5 : Number(l.vatRate)), discountPct: String(Number(l.discountPct) || 0) }));
        setLines(ls.length ? ls : [blankLine()]); setLoading(false);
      }).catch(() => { setErr("Could not load"); setLoading(false); });
    }
  }, [editing, editId, cfg.api, cfg.detailKey, cfg.dateRaw]);

  React.useEffect(() => { if (!editing && customers.length && !customerId) setCustomerId(customers[0]!.id); }, [customers, editing, customerId]);

  const calc = React.useMemo(() => {
    let sub = 0, vat = 0; const byRate = new Map<number, number>();
    for (const l of lines) {
      const qty = parseFloat(l.qty) || 0, up = parseFloat(l.unitPrice) || 0, disc = parseFloat(l.discountPct) || 0, vr = parseFloat(l.vatRate) || 0;
      const net = qty * up * (1 - disc / 100); sub += net; const v = net * vr / 100; vat += v;
      if (net > 0) byRate.set(vr, (byRate.get(vr) || 0) + v);
    }
    return { sub, vat, total: sub + vat, byRate: Array.from(byRate.entries()).sort((a, b) => b[0] - a[0]) };
  }, [lines]);

  function setLine(i: number, patch: Partial<Line>) { setTouched(true); setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l))); }
  function addLine() { setTouched(true); setLines((ls) => [...ls, blankLine(String((settings.defaultVatRate as number) ?? 5))]); }
  function removeLine(i: number) { setTouched(true); setLines((ls) => (ls.length > 1 ? ls.filter((_, k) => k !== i) : [blankLine()])); }
  function moveLine(i: number, dir: -1 | 1) { setTouched(true); setLines((ls) => { const j = i + dir; if (j < 0 || j >= ls.length) return ls; const n = [...ls]; const t = n[i]!; n[i] = n[j]!; n[j] = t; return n; }); }
  function pickItem(i: number, id: string) {
    if (!id) { setLine(i, { itemId: "" }); return; }
    const it = items.find((x) => x.id === id); if (!it) return;
    setLine(i, { itemId: id, name: it.name, unitPrice: String(Number(it.unitPrice) || 0), vatRate: String(Number(it.vatRate) || 5) });
  }
  function addFromCatalog(it: Item) {
    const line: Line = { itemId: it.id, name: it.name, qty: "1", unitPrice: String(Number(it.unitPrice) || 0), vatRate: String(Number(it.vatRate) || 5), discountPct: "0" };
    setTouched(true);
    setLines((ls) => { const empty = ls.findIndex((l) => !l.name.trim() && !parseFloat(l.unitPrice)); if (empty >= 0) { const n = [...ls]; n[empty] = line; return n; } return [...ls, line]; });
  }
  function addSelected() {
    const chosen = items.filter((x) => sel.includes(x.id));
    if (!chosen.length) { setPicker(false); return; }
    setTouched(true);
    setLines((ls) => {
      const base = ls.filter((l) => l.name.trim() || parseFloat(l.unitPrice));
      const add = chosen.map((it): Line => ({ itemId: it.id, name: it.name, qty: "1", unitPrice: String(Number(it.unitPrice) || 0), vatRate: String(Number(it.vatRate) || 5), discountPct: "0" }));
      return base.length ? [...base, ...add] : add;
    });
    setSel([]); setPicker(false);
  }

  const hasCustomer = mode === "existing" ? !!customerId : !!customerName.trim();
  const hasLine = lines.some((l) => l.name.trim() || (parseFloat(l.unitPrice) || 0) > 0);
  const canSave = hasCustomer && hasLine && !saving;
  const issues = [!hasCustomer && "Choose a customer", !hasLine && "Add at least one line with a price"].filter(Boolean) as string[];

  async function save(send: boolean) {
    if (!canSave) { setErr(issues[0] || "Complete the form"); return; }
    setSaving(send ? "send" : "save"); setErr("");
    const linePayload = lines.filter((l) => l.name.trim() || (parseFloat(l.unitPrice) || 0) > 0).map((l) => ({ name: l.name, qty: parseFloat(l.qty) || 0, unitPrice: parseFloat(l.unitPrice) || 0, vatRate: parseFloat(l.vatRate) || 0, discountPct: parseFloat(l.discountPct) || 0 }));
    const body: Record<string, unknown> = { currency, notes, subject: subject || null, terms: terms || null, issueDate: issueDate || null, [cfg.dateKey]: date || null, referenceNo: referenceNo || null, projectName: projectName || null, salespersonId: salespersonId || null, lines: linePayload };
    if (mode === "existing") body.customerId = customerId; else body.customerName = customerName.trim();
    try {
      let res: Response; let docId = editId;
      if (editing) res = await fetch(`${cfg.api}/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      else res = await fetch(cfg.api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.error || "Could not save"); setSaving(""); return; }
      if (!editing) { const j = await res.json().catch(() => ({})); docId = j.id; }
      if (send && docId) await fetch(`${cfg.api}/${docId}/send`, { method: "POST" }).catch(() => {});
      window.location.href = docId ? `${cfg.list}/${docId}` : cfg.list;
    } catch { setErr("Network error"); setSaving(""); }
  }
  function cancel() { if (touched && !confirm("Discard unsaved changes?")) return; window.location.href = editing ? `${cfg.list}/${editId}` : cfg.list; }

  const filteredItems = items.filter((it) => (it.name + " " + it.description).toLowerCase().includes(pq.toLowerCase()));
  const tc = (settings.templateConfig as Record<string, string> | null | undefined) || undefined;
  const accent: string = (tc?.accent || tc?.accentColor || color.brand.primary) as string;
  const merchant = (settings.legalName as string) || "Your company";
  const custLabel = mode === "existing" ? (customers.find((c) => c.id === customerId)?.name || "Customer") : (customerName || "New customer");
  const onBind = () => setTouched(true);

  if (loading) return <AppShell active={cfg.active}><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;

  return (
    <AppShell active={cfg.active}>
      {/* Sticky action bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", marginBottom: 12, background: color.surface.page, borderBottom: `1px solid ${color.line.DEFAULT}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span aria-hidden style={{ width: 36, height: 36, borderRadius: 10, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: color.ink.soft }}>{cfg.crumb}</div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{editing ? `Edit ${cfg.noun.toLowerCase()}` : `New ${cfg.noun.toLowerCase()}`}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Button onClick={cancel}>Cancel</Button>
          <Button onClick={() => save(true)} disabled={!canSave}>{saving === "send" ? "Sending…" : "Save & Send"}</Button>
          <Button variant="primary" onClick={() => save(false)} disabled={!canSave}>{saving === "save" ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button>
        </div>
      </div>

      {err ? <div style={{ background: `color-mix(in srgb, ${color.status.critical} 12%, ${color.surface.card})`, color: color.status.critical, border: `1px solid ${color.status.critical}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <div>
          {/* Customer + details */}
          <section style={{ ...cardS, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Customer *</label>
                {mode === "existing" ? (
                  <select value={customerId} onChange={(e) => { onBind(); setCustomerId(e.target.value); }} style={{ ...cell, height: 38, borderColor: !hasCustomer ? color.status.critical : color.line.strong }}>
                    {customers.length === 0 ? <option value="">No customers yet</option> : null}
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ""}</option>)}
                  </select>
                ) : (
                  <Input placeholder="Customer name" value={customerName} onChange={(e) => { onBind(); setCustomerName(e.target.value); }} style={{ width: "100%" }} />
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: color.ink.mid, cursor: "pointer" }}><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Existing</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: color.ink.mid, cursor: "pointer" }}><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> New</label>
                  <span style={{ fontSize: 11.5, color: color.ink.soft, alignSelf: "center" }}>CRM-synced — no duplicates.</span>
                </div>
              </div>
              <div><label style={lbl}>{cfg.noun} date</label><input type="date" value={issueDate} onChange={(e) => { onBind(); setIssueDate(e.target.value); }} style={{ ...cell, height: 38 }} /></div>
              <div><label style={lbl}>Terms / {cfg.dateLabel}</label><select value={payTerms} onChange={(e) => { onBind(); applyTerms(e.target.value); }} style={{ ...cell, height: 38, marginBottom: 6 }}><option value="">Custom date</option><option value="0">Due on receipt</option><option value="15">Net 15</option><option value="30">Net 30</option><option value="45">Net 45</option><option value="60">Net 60</option></select><input type="date" value={date} onChange={(e) => { onBind(); setDate(e.target.value); setPayTerms(""); }} style={{ ...cell, height: 38 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <div><label style={lbl}>Currency</label><input value={currency} onChange={(e) => { onBind(); setCurrency(e.target.value); }} style={{ ...cell, height: 38 }} /></div>
              <div><label style={lbl}>Reference #</label><Input placeholder="PO / internal ref" value={referenceNo} onChange={(e) => { onBind(); setReferenceNo(e.target.value); }} style={{ width: "100%" }} /></div>
              <div><label style={lbl}>Salesperson</label><select value={salespersonId} onChange={(e) => { onBind(); setSalespersonId(e.target.value); }} style={{ ...cell, height: 38 }}><option value="">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
              <div><label style={lbl}>Project name</label><Input placeholder="Optional" value={projectName} onChange={(e) => { onBind(); setProjectName(e.target.value); }} style={{ width: "100%" }} /></div>
            </div>
            <div style={{ marginTop: 14 }}><label style={lbl}>Subject</label><Input placeholder="Short subject shown on the document (e.g. Website redesign — Phase 1)" value={subject} onChange={(e) => { onBind(); setSubject(e.target.value); }} style={{ width: "100%" }} /></div>
          </section>

          {/* Line items */}
          <section style={{ ...cardS, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>Line items</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => { setPq(""); setSel([]); setPicker(true); }}>≣ Add from catalog</Button>
                <Button variant="primary" onClick={addLine}>+ Add line</Button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 110px 62px 62px 116px 52px", gap: 8, fontSize: 10.5, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.3, padding: "0 2px 6px" }}>
              <span>Item</span><span>Qty</span><span>Unit price</span><span>VAT %</span><span>Disc %</span><span style={{ textAlign: "right" }}>Amount</span><span />
            </div>
            {lines.map((l, i) => {
              const qty = parseFloat(l.qty) || 0, up = parseFloat(l.unitPrice) || 0, disc = parseFloat(l.discountPct) || 0;
              const net = qty * up * (1 - disc / 100);
              return (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < lines.length - 1 ? `1px solid ${color.line.DEFAULT}` : "none" }}>
                  {items.length > 0 ? (
                    <select value={l.itemId} onChange={(e) => pickItem(i, e.target.value)} style={{ ...cell, height: 32, marginBottom: 6, fontSize: 12.5, color: l.itemId ? color.ink.DEFAULT : color.ink.soft }}>
                      <option value="">Custom line… (or pick from catalog)</option>
                      {items.map((it) => <option key={it.id} value={it.id}>{it.name} — {currency} {fmt(Number(it.unitPrice) || 0)}</option>)}
                    </select>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 110px 62px 62px 116px 52px", gap: 8, alignItems: "center" }}>
                    <input value={l.name} placeholder="Description of item or service" onChange={(e) => setLine(i, { name: e.target.value })} style={cell} />
                    <input value={l.qty} inputMode="decimal" onChange={(e) => setLine(i, { qty: e.target.value })} style={cell} />
                    <input value={l.unitPrice} inputMode="decimal" placeholder="0.00" onChange={(e) => setLine(i, { unitPrice: e.target.value })} style={cell} />
                    <input value={l.vatRate} inputMode="decimal" onChange={(e) => setLine(i, { vatRate: e.target.value })} style={cell} />
                    <input value={l.discountPct} inputMode="decimal" onChange={(e) => setLine(i, { discountPct: e.target.value })} style={cell} />
                    <span style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{fmt(net)}</span>
                    <span style={{ display: "inline-flex", gap: 2, justifyContent: "flex-end" }}>
                      <button aria-label="Move up" onClick={() => moveLine(i, -1)} style={{ width: 22, height: 28, borderRadius: 6, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer", fontSize: 9 }}>▲</button>
                      <button aria-label="Remove" onClick={() => removeLine(i)} style={{ width: 24, height: 28, borderRadius: 6, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer" }}>×</button>
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Notes + Terms */}
          <section style={cardS}>
            <label style={lbl}>Customer notes (printed on the document)</label>
            <textarea value={notes} onChange={(e) => { onBind(); setNotes(e.target.value); }} rows={3} placeholder="e.g. Thank you for your business." style={{ ...cell, height: "auto", padding: 9, resize: "vertical" }} />
            <label style={{ ...lbl, marginTop: 14 }}>Terms &amp; conditions</label>
            <textarea value={terms} onChange={(e) => { onBind(); setTerms(e.target.value); }} rows={3} placeholder="Payment terms, warranty, validity, jurisdiction…" style={{ ...cell, height: "auto", padding: 9, resize: "vertical" }} />
          </section>
        </div>

        {/* Right: summary + live preview */}
        <div style={{ position: "sticky", top: 64, display: "flex", flexDirection: "column", gap: 16 }}>
          <section style={{ ...cardS, background: color.surface.sunken }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 12px" }}>Summary</h2>
            <Row k="Subtotal" v={aed(calc.sub)} />
            {calc.byRate.map(([rate, v]) => <Row key={rate} k={`VAT ${rate}%`} v={aed(v)} dim />)}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: color.ink.DEFAULT, borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 10, marginTop: 4 }}><span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(calc.total)}</span></div>
            {issues.length ? <div style={{ marginTop: 10, fontSize: 11.5, color: color.status.critical }}>{issues.map((x) => <div key={x}>• {x}</div>)}</div> : null}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <Button variant="primary" onClick={() => save(false)} disabled={!canSave}>{saving === "save" ? "Saving…" : editing ? "Save changes" : "Save draft"}</Button>
              <Button onClick={() => save(true)} disabled={!canSave}>{saving === "send" ? "Sending…" : "Save & Send"}</Button>
            </div>
          </section>

          {/* Live preview */}
          <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 4, background: accent }} />
            <div style={{ padding: 16, color: "#1d2733" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  {settings.logoUrl ? <img src={String(settings.logoUrl)} alt="" style={{ height: 26, marginBottom: 4 }} /> : <div style={{ fontWeight: 800, fontSize: 13 }}>{merchant}</div>}
                </div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 800, color: accent }}>{cfg.noun.toUpperCase()}</div><div style={{ fontSize: 10.5, color: "#5b6b7b" }}>Draft</div></div>
              </div>
              <div style={{ fontSize: 10, color: "#8a97a5", textTransform: "uppercase" }}>Bill to</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: subject ? 4 : 10 }}>{custLabel}</div>{subject ? <div style={{ fontSize: 11.5, color: "#5b6b7b", marginBottom: 10 }}><span style={{ color: "#8a97a5" }}>Subject: </span>{subject}</div> : null}
              <div style={{ borderTop: "1px solid #eef1f5" }}>
                {lines.filter((l) => l.name.trim() || parseFloat(l.unitPrice)).slice(0, 6).map((l, i) => { const net = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0) * (1 - (parseFloat(l.discountPct) || 0) / 100); return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", fontSize: 11.5, borderBottom: "1px solid #f4f6f9" }}><span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name || "—"} <span style={{ color: "#8a97a5" }}>×{parseFloat(l.qty) || 0}</span></span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(net)}</span></div>
                ); })}
                {lines.filter((l) => l.name.trim() || parseFloat(l.unitPrice)).length === 0 ? <div style={{ padding: "10px 0", fontSize: 11.5, color: "#8a97a5", textAlign: "center" }}>Add a line to preview</div> : null}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <div style={{ width: 150 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5b6b7b", padding: "2px 0" }}><span>Subtotal</span><span>{fmt(calc.sub)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5b6b7b", padding: "2px 0" }}><span>VAT</span><span>{fmt(calc.vat)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, padding: "4px 0", borderTop: `2px solid ${accent}`, color: accent }}><span>Total</span><span>{aed(calc.total)}</span></div>
                </div>
              </div>
            </div>
          </section>
          <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", margin: 0 }}>Live preview · final PDF uses your Books design</p>
        </div>
      </div>

      {picker ? (
        <div onClick={() => setPicker(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: "80vh", background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT }}>Add from catalog</h2>
              <button aria-label="Close" onClick={() => setPicker(false)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <Input placeholder="Search items…" value={pq} onChange={(e) => setPq(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
            <div style={{ overflowY: "auto", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9 }}>
              {filteredItems.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>{items.length === 0 ? "No catalog items yet. Add some under Products." : "No matches."}</div>
                : filteredItems.map((it) => { const on = sel.includes(it.id); return (
                  <button key={it.id} onClick={() => setSel((cur) => cur.includes(it.id) ? cur.filter((x) => x !== it.id) : [...cur, it.id])} style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 14px", border: 0, borderBottom: `1px solid ${color.line.DEFAULT}`, background: on ? color.brand.primaryTint : color.surface.card, cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                      <span aria-hidden style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 5, border: `1.5px solid ${on ? color.brand.primary : color.line.strong}`, background: on ? color.brand.primary : "transparent", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{on ? "✓" : ""}</span>
                      <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>{it.description ? <span style={{ display: "block", fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.description}</span> : null}</span>
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: color.brand.primary }}>{currency} {fmt(Number(it.unitPrice) || 0)}</span>
                  </button>
                ); })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10 }}>
              <span style={{ fontSize: 12, color: color.ink.soft }}>{sel.length} selected</span>
              <span style={{ display: "inline-flex", gap: 8 }}>
                <Button onClick={() => setPicker(false)}>Cancel</Button>
                <Button variant="primary" onClick={addSelected} disabled={sel.length === 0}>{sel.length > 1 ? `Add ${sel.length} items` : "Add item"}</Button>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Row({ k, v, dim }: { k: string; v: string; dim?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: dim ? color.ink.soft : color.ink.mid, padding: "3px 0" }}><span>{k}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span></div>;
}
