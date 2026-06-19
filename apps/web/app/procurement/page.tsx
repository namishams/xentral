"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, Input, StatusBadge, DataTable, EmptyState, Modal, type Column } from "@xentral/ui";

type PO = { id: string; number: string; supplier: string; status: string; total: number; currency: string; orderDate: string; expectedDate: string; items: number };
type Supplier = { id: string; name: string };
type Line = { name: string; qty: string; unitPrice: string; vatRate: string };
const sTone = (s: string): "neutral" | "info" | "positive" | "warning" | "critical" =>
  s === "RECEIVED" ? "positive" : s === "SENT" ? "info" : s === "CANCELLED" ? "critical" : "neutral";
const blank = (): Line => ({ name: "", qty: "1", unitPrice: "", vatRate: "5" });

export default function ProcurementPage() {
  const [rows, setRows] = React.useState<PO[]>([]);
  const [kpis, setKpis] = React.useState({ count: 0, openCount: 0, committed: 0, received: 0, currency: "AED" });
  const [loading, setLoading] = React.useState(true);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [supplierId, setSupplierId] = React.useState("");
  const [newSupplier, setNewSupplier] = React.useState("");
  const [expectedDate, setExpectedDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([blank()]);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/erp/purchase-orders").then((r) => r.json()).then((d) => { setRows(d.rows ?? []); if (d.kpis) setKpis({ count: d.kpis.count || 0, openCount: d.kpis.openCount || 0, committed: d.kpis.committed || 0, received: d.kpis.received || 0, currency: d.kpis.currency || "AED" }); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); fetch("/api/erp/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.rows ?? [])).catch(() => {}); }, [load]);

  const cur = kpis.currency || "AED";
  const aed = (n: number) => `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;
  const calc = lines.reduce((acc, l) => { const net = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0); const vat = net * (parseFloat(l.vatRate) || 0) / 100; return { sub: acc.sub + net, total: acc.total + net + vat }; }, { sub: 0, total: 0 });

  function setLine(i: number, patch: Partial<Line>) { setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l))); }
  async function create() {
    if (!supplierId && !newSupplier.trim()) { setErr("Choose or name a supplier"); return; }
    const payload = { supplierId: supplierId || null, supplierName: newSupplier.trim() || null, expectedDate: expectedDate || null, notes: notes || null, lines: lines.filter((l) => l.name.trim() || parseFloat(l.unitPrice)) };
    if (payload.lines.length === 0) { setErr("Add at least one line"); return; }
    setSaving(true); setErr("");
    const r = await fetch("/api/erp/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Failed"); return; }
    setOpen(false); setSupplierId(""); setNewSupplier(""); setExpectedDate(""); setNotes(""); setLines([blank()]); load();
  }

  const lab: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
  const inS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 7, padding: "0 9px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };

  const COLS: Column<PO>[] = [
    { key: "number", header: "PO", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
    { key: "supplier", header: "Supplier", render: (r) => <span style={{ color: color.ink.DEFAULT }}>{r.supplier}</span> },
    { key: "items", header: "Items", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.items}</span> },
    { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={sTone(r.status)} label={(r.status || "").toLowerCase()} /> },
    { key: "expectedDate", header: "Expected", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.expectedDate || "—"}</span> },
    { key: "total", header: "Total", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(r.total)}</span> },
  ];

  return (
    <AppShell active="procurement">
      <PageTitleRow title="Procurement" subtitle="Purchase orders to your suppliers"
        actions={<Button variant="primary" onClick={() => { setErr(""); setOpen(true); }}>+ New purchase order</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Purchase orders" value={String(kpis.count)} note="all time" noteTone={color.brand.primary} />
        <KPICard label="Open" value={String(kpis.openCount)} note="draft / sent" noteTone={color.status.info} />
        <KPICard label="Committed" value={aed(kpis.committed)} note="open value" noteTone={color.ink.soft} />
        <KPICard label="Received" value={String(kpis.received)} note="completed" noteTone={color.status.positive} />
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No purchase orders yet" hint="Raise a PO to a supplier with line items — committed spend and receipts track here." action={<Button variant="primary" onClick={() => setOpen(true)}>+ New purchase order</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} searchable searchPlaceholder="Search POs…" title="Purchase orders" />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Procurement · purchase orders · tenant-scoped</p>

      <Modal open={open} onClose={() => setOpen(false)} title="New purchase order" size="lg"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={create} disabled={saving}>{saving ? "Creating…" : "Create PO"}</Button></>}>
        <div style={{ display: "grid", gap: 13 }}>
          {err && <div style={{ fontSize: 13, color: color.status.negative, background: "#FEF2F2", border: `1px solid ${color.status.negative}33`, borderRadius: 8, padding: "8px 10px" }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lab}>Supplier</label><select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ ...inS, height: 36 }}><option value="">{suppliers.length ? "Select supplier…" : "No suppliers — type one →"}</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label style={lab}>…or new supplier</label><input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="New supplier name" style={{ ...inS, height: 36 }} disabled={!!supplierId} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lab}>Expected date</label><input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} style={{ ...inS, height: 36 }} /></div>
            <div><label style={lab}>Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" style={{ ...inS, height: 36 }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={lab}>Line items</label>
              <Button onClick={() => setLines((ls) => [...ls, blank()])}>+ Add line</Button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 96px 56px 90px 32px", gap: 6, fontSize: 10, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", padding: "0 2px 4px" }}>
              <span>Item</span><span>Qty</span><span>Unit</span><span>VAT%</span><span style={{ textAlign: "right" }}>Amount</span><span />
            </div>
            {lines.map((l, i) => { const net = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0); return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 96px 56px 90px 32px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input value={l.name} placeholder="Description" onChange={(e) => setLine(i, { name: e.target.value })} style={inS} />
                <input value={l.qty} inputMode="decimal" onChange={(e) => setLine(i, { qty: e.target.value })} style={inS} />
                <input value={l.unitPrice} inputMode="decimal" placeholder="0.00" onChange={(e) => setLine(i, { unitPrice: e.target.value })} style={inS} />
                <input value={l.vatRate} inputMode="decimal" onChange={(e) => setLine(i, { vatRate: e.target.value })} style={inS} />
                <span style={{ textAlign: "right", fontSize: 12.5, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{net.toFixed(2)}</span>
                <button aria-label="Remove" onClick={() => setLines((ls) => ls.length > 1 ? ls.filter((_, k) => k !== i) : [blank()])} style={{ width: 28, height: 30, borderRadius: 6, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.soft, cursor: "pointer" }}>×</button>
              </div>
            ); })}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, marginTop: 8, fontSize: 13 }}>
              <span style={{ color: color.ink.soft }}>Subtotal {aed(calc.sub)}</span>
              <span style={{ fontWeight: 800, color: color.ink.DEFAULT }}>Total {aed(calc.total)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
