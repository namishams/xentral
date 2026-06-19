"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, Input, StatusBadge, EmptyState, Modal } from "@xentral/ui";

type L = { id: string; name: string; description: string; color: string; entityType: string; kind: string; isPinned: boolean; memberCount: number };
const ENTITIES: [string, string][] = [["contact", "Contacts"], ["company", "Companies"], ["lead", "Leads"], ["deal", "Deals"], ["customer", "Customers"]];
const SWATCHES = ["#0064d9", "#188918", "#df6e0c", "#cc1919", "#7c3aed", "#0891b2", "#be185d", "#475569"];

export default function ListsPage() {
  const [rows, setRows] = React.useState<L[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [f, setF] = React.useState({ name: "", description: "", entityType: "contact", kind: "list", color: SWATCHES[0]! });

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/crm/lists").then((r) => r.json()).then((d) => { setRows(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function create() {
    if (!f.name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr("");
    const r = await fetch("/api/crm/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setSaving(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Failed"); return; }
    setOpen(false); setF({ name: "", description: "", entityType: "contact", kind: "list", color: SWATCHES[0]! }); load();
  }
  async function remove(l: L) {
    if (!confirm(`Delete list "${l.name}"? Members are unlinked (records are kept).`)) return;
    const r = await fetch(`/api/crm/lists?id=${l.id}`, { method: "DELETE" });
    if (r.ok) load();
  }

  const lists = rows.filter((r) => r.kind !== "segment");
  const segments = rows.filter((r) => r.kind === "segment");
  const lab: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
  const inS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };

  const Card = ({ l }: { l: L }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, background: color.surface.card }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color || color.brand.primary, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{l.name}{l.isPinned ? " ★" : ""}</div>
        <div style={{ fontSize: 12, color: color.ink.soft }}>{l.description || ENTITIES.find((e) => e[0] === l.entityType)?.[1] || l.entityType}</div>
      </div>
      <StatusBadge tone="neutral" label={`${l.memberCount} ${l.memberCount === 1 ? "record" : "records"}`} />
      <a href={`/${l.entityType === "customer" ? "customers" : l.entityType + "s"}?list=${l.id}`} style={{ textDecoration: "none" }}><Button>Open</Button></a>
      <button onClick={() => remove(l)} aria-label="Delete" style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.status.negative, cursor: "pointer" }}>×</button>
    </div>
  );

  return (
    <AppShell active="lists">
      <PageTitleRow title="Lists & Segments" subtitle={`${lists.length} list${lists.length === 1 ? "" : "s"} · ${segments.length} segment${segments.length === 1 ? "" : "s"}`}
        actions={<Button variant="primary" onClick={() => { setErr(""); setOpen(true); }}>+ New list</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 18 }}>
        <KPICard label="Lists" value={String(lists.length)} note="manual" noteTone={color.brand.primary} />
        <KPICard label="Segments" value={String(segments.length)} note="dynamic" noteTone={color.status.info} />
        <KPICard label="Total records" value={String(rows.reduce((s, r) => s + (r.memberCount || 0), 0))} note="across lists" noteTone={color.ink.soft} />
        <KPICard label="Pinned" value={String(rows.filter((r) => r.isPinned).length)} note="favourites" noteTone={color.status.positive} />
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No lists yet" hint="Group contacts, companies, leads or deals into lists and segments for targeted follow-up and campaigns." action={<Button variant="primary" onClick={() => setOpen(true)}>+ New list</Button>} />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {lists.length ? <div><h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft, textTransform: "uppercase", margin: "0 0 10px" }}>Lists</h2><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{lists.map((l) => <Card key={l.id} l={l} />)}</div></div> : null}
              {segments.length ? <div><h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: color.ink.soft, textTransform: "uppercase", margin: "0 0 10px" }}>Segments</h2><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{segments.map((l) => <Card key={l.id} l={l} />)}</div></div> : null}
            </div>
          )}

      <Modal open={open} onClose={() => setOpen(false)} title="New list or segment" size="md"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={create} disabled={saving}>{saving ? "Creating…" : "Create"}</Button></>}>
        <div style={{ display: "grid", gap: 13 }}>
          {err && <div style={{ fontSize: 13, color: color.status.negative, background: "#FEF2F2", border: `1px solid ${color.status.negative}33`, borderRadius: 8, padding: "8px 10px" }}>{err}</div>}
          <div><label style={lab}>Name *</label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. VIP customers, Dubai leads" autoFocus /></div>
          <div><label style={lab}>Description</label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Optional" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lab}>Applies to</label><select value={f.entityType} onChange={(e) => setF({ ...f, entityType: e.target.value })} style={inS}>{ENTITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><label style={lab}>Type</label><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} style={inS}><option value="list">List (manual)</option><option value="segment">Segment (filter)</option></select></div>
          </div>
          <div>
            <label style={lab}>Colour</label>
            <div style={{ display: "flex", gap: 8 }}>
              {SWATCHES.map((c) => <button key={c} onClick={() => setF({ ...f, color: c })} aria-label={c} style={{ width: 26, height: 26, borderRadius: 7, background: c, border: f.color === c ? `2px solid ${color.ink.DEFAULT}` : `1px solid ${color.line.strong}`, cursor: "pointer" }} />)}
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
