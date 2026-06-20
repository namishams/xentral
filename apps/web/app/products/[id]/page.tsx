"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, type BadgeTone, Panel, PanelHeader, PanelBody, AiInlineBar } from "@xentral/ui";

type Item = {
  id: string; name: string; description: string; sku: string; category: string;
  unitPrice: number; vatRate: number; kind: string; recurring: boolean; active: boolean;
  created: string | null; updated: string | null;
};
const aed = (n: number) => `AED ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [it, setIt] = React.useState<Item | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [edit, setEdit] = React.useState<Item | null>(null);

  const load = React.useCallback(() => {
    fetch(`/api/books/items/${params.id}`).then((r) => r.json()).then((d) => { setIt(d.item ?? null); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);
  React.useEffect(() => { load(); }, [load]);

  function openEdit() { if (it) setEdit({ ...it }); }
  async function saveEdit() {
    if (!edit) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/books/items/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: edit.name, description: edit.description, sku: edit.sku, category: edit.category, unitPrice: Number(edit.unitPrice), vatRate: Number(edit.vatRate), kind: edit.kind, recurring: edit.recurring, active: edit.active }),
      });
      if (res.ok) { setEdit(null); setToast("Saved"); load(); } else { const j = await res.json().catch(() => ({})); setToast(j.error || "Could not save"); }
    } finally { setBusy(false); }
  }

  if (loading) return <AppShell active="products"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;
  if (!it) return <AppShell active="products"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Product not found. <a href="/products" style={{ color: color.brand.primary }}>Back to products</a></div></AppShell>;

  const incVat = it.unitPrice * (1 + (Number(it.vatRate) || 0) / 100);
  const isService = String(it.kind).toUpperCase() === "SERVICE";
  const fieldS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 14, color: color.ink.DEFAULT, background: color.surface.card, marginBottom: 12 };
  const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };

  return (
    <AppShell active="products">
      <PageTitleRow title={it.name} breadcrumb="Books · Products"
        badge={<div style={{ display: "flex", gap: 6 }}>
          <StatusBadge tone="info" label={isService ? "service" : "product"} />
          <StatusBadge tone={it.active ? "positive" : "neutral"} label={it.active ? "active" : "inactive"} />
          {it.recurring ? <StatusBadge tone="info" label="recurring" /> : null}
        </div>}
        actions={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button onClick={openEdit}>Edit</Button>
          <a href="/invoices/new"><Button variant="primary">Add to invoice</Button></a>
        </div>} />

      <AiInlineBar subject={it.name} />

      {toast ? <div style={{ background: `color-mix(in srgb, ${color.brand.primary} 10%, ${color.surface.card})`, border: `1px solid ${color.brand.primary}`, color: color.brand.primary, borderRadius: 9, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{toast}</div> : null}

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPICard label="Sales price" value={aed(it.unitPrice)} note="ex VAT" noteTone={color.ink.soft} />
        <KPICard label="Price incl. VAT" value={aed(incVat)} note={`${Number(it.vatRate)}% UAE VAT`} noteTone={color.ink.soft} />
        <KPICard label="VAT rate" value={`${Number(it.vatRate)}%`} note="tax class" noteTone={color.ink.soft} />
        <KPICard label="Type" value={isService ? "Service" : "Product"} note={it.recurring ? "recurring" : "one-off"} noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Identity" />
          <PanelBody>
            <Row k="Name" v={it.name} />
            <Row k="SKU" v={it.sku || "—"} />
            <Row k="Category" v={it.category || "—"} />
            <Row k="Type" v={isService ? "Service" : "Product"} />
            <Row k="Description" v={it.description || "—"} />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Pricing & tax" />
          <PanelBody>
            <Row k="Sales price (ex VAT)" v={aed(it.unitPrice)} />
            <Row k="VAT rate" v={`${Number(it.vatRate)}%`} />
            <Row k="VAT amount" v={aed(incVat - it.unitPrice)} />
            <Row k="Price incl. VAT" v={aed(incVat)} />
            <Row k="Billing" v={it.recurring ? "Recurring" : "One-off"} />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Status & lifecycle" />
          <PanelBody>
            <Row k="Status" v={it.active ? "Active" : "Inactive"} />
            <Row k="Created" v={it.created || "—"} />
            <Row k="Last updated" v={it.updated || "—"} />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Usage" />
          <PanelBody>
            <p style={{ fontSize: 13, color: color.ink.soft, margin: 0, lineHeight: 1.6 }}>
              This item is available in the line-item picker (“Add from catalog”) on every invoice and quote. Edit the price or VAT here and it flows to new documents automatically.
            </p>
          </PanelBody>
        </Panel>
      </div>

      {edit ? (
        <div onClick={() => !busy && setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>Edit product</h2>
              <button aria-label="Close" onClick={() => setEdit(null)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <label style={lbl}>Name</label>
            <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} style={fieldS} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label style={lbl}>SKU</label><input value={edit.sku} onChange={(e) => setEdit({ ...edit, sku: e.target.value })} style={fieldS} /></div>
              <div style={{ flex: 1 }}><label style={lbl}>Category</label><input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} style={fieldS} /></div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label style={lbl}>Sales price</label><input type="number" value={edit.unitPrice} onChange={(e) => setEdit({ ...edit, unitPrice: Number(e.target.value) })} style={fieldS} /></div>
              <div style={{ flex: 1 }}><label style={lbl}>VAT %</label><input type="number" value={edit.vatRate} onChange={(e) => setEdit({ ...edit, vatRate: Number(e.target.value) })} style={fieldS} /></div>
            </div>
            <label style={lbl}>Type</label>
            <select value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })} style={fieldS}><option value="PRODUCT">Product</option><option value="SERVICE">Service</option></select>
            <label style={lbl}>Description</label>
            <textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} rows={3} style={{ ...fieldS, height: "auto", padding: 11, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 18, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: color.ink.DEFAULT, cursor: "pointer" }}><input type="checkbox" checked={edit.recurring} onChange={(e) => setEdit({ ...edit, recurring: e.target.checked })} /> Recurring</label>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: color.ink.DEFAULT, cursor: "pointer" }}><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setEdit(null)} disabled={busy}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "7px 0", borderBottom: `1px solid ${color.line.DEFAULT}` }}><span style={{ fontSize: 13, color: color.ink.soft }}>{k}</span><span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT, textAlign: "right" }}>{v}</span></div>;
}
