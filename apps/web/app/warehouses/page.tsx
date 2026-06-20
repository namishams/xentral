"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, Input, EmptyState, Modal } from "@xentral/ui";

type W = { id: string; code: string; name: string; location: string; created: string };

export default function WarehousesPage() {
  const [rows, setRows] = React.useState<W[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [f, setF] = React.useState({ name: "", code: "", location: "" });

  const load = React.useCallback(() => { setLoading(true); fetch("/api/erp/warehouses").then((r) => r.json()).then((d) => { setRows(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  React.useEffect(() => { load(); }, [load]);

  async function create() {
    if (!f.name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr("");
    const r = await fetch("/api/erp/warehouses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setSaving(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Failed"); return; }
    setOpen(false); setF({ name: "", code: "", location: "" }); load();
  }

  const lab: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };

  return (
    <AppShell active="warehouses">
      <PageTitleRow title="Warehouses" subtitle={`${rows.length} stock location${rows.length === 1 ? "" : "s"}`}
        actions={<Button variant="primary" onClick={() => { setErr(""); setOpen(true); }}>+ New warehouse</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 18 }}>
        <KPICard label="Locations" value={String(rows.length)} note="active" noteTone={color.brand.primary} />
        <KPICard label="With code" value={String(rows.filter((r) => r.code).length)} note="coded" noteTone={color.ink.soft} />
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No warehouses yet" hint="Add stock locations to track inventory by site." action={<Button variant="primary" onClick={() => setOpen(true)}>+ New warehouse</Button>} />
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {rows.map((w) => (
                <div key={w.id} style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "14px 16px", background: color.surface.card }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>▤</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>{w.code ? <div style={{ fontSize: 12, color: color.ink.soft, fontFamily: "ui-monospace, monospace" }}>{w.code}</div> : null}</div>
                  </div>
                  <div style={{ fontSize: 13, color: color.ink.mid }}>{w.location || "No location set"}</div>
                </div>
              ))}
            </div>
          )}

      <Modal open={open} onClose={() => setOpen(false)} title="New warehouse" size="sm"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={create} disabled={saving}>{saving ? "Creating…" : "Create"}</Button></>}>
        <div style={{ display: "grid", gap: 12 }}>
          {err && <div style={{ fontSize: 13, color: color.status.negative, background: "#FEF2F2", border: `1px solid ${color.status.negative}33`, borderRadius: 8, padding: "8px 10px" }}>{err}</div>}
          <div><label style={lab}>Name *</label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Dubai Main Store" autoFocus /></div>
          <div><label style={lab}>Code</label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="WH-DXB" /></div>
          <div><label style={lab}>Location</label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Jebel Ali, Dubai" /></div>
        </div>
      </Modal>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Warehouses · stock locations · tenant-scoped</p>
    </AppShell>
  );
}
