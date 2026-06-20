"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, ExportMenu, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, Modal, type Column } from "@xentral/ui";

type ApiRow = { id: string; name: string; description: string; sku: string; category: string; unitPrice: number; vatRate: number; kind: string; recurring?: boolean; active: boolean };
type Row = { id: string; name: string; description: string; sku: string; kind: string; price: number; vat: number; category: string; recurring: boolean; active: boolean };
type Cat = { id: string; name: string; industry: string; itemType: string; itemCount: number };
const aed = (n: number) => `AED ${Math.round(Number(n) || 0).toLocaleString()}`;

type Draft = { id?: string; name: string; kind: string; sku: string; category: string; description: string; unitPrice: string; vatRate: string; recurring: boolean; active: boolean };
const EMPTY: Draft = { name: "", kind: "SERVICE", sku: "", category: "", description: "", unitPrice: "", vatRate: "5", recurring: false, active: true };
const INDUSTRIES = ["Real Estate", "Healthcare", "Retail", "Hospitality", "Construction", "Education", "Professional Services", "Logistics", "Manufacturing", "Technology"];

const fieldLabel: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: color.ink.mid, marginBottom: 5 };
const selectStyle: React.CSSProperties = { width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: "#fff", color: color.ink.DEFAULT, fontSize: 14 };

export default function ProductsPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState<"ALL" | "SERVICE" | "PRODUCT">("ALL");
  const [catFilter, setCatFilter] = React.useState<string>("ALL");

  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const [cats, setCats] = React.useState<Cat[]>([]);
  const [catOpen, setCatOpen] = React.useState(false);
  const [catDraft, setCatDraft] = React.useState({ name: "", industry: "", itemType: "" });
  const [catBusy, setCatBusy] = React.useState(false);
  const [catErr, setCatErr] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/books/items?all=1").then((r) => r.json()).then((d) => {
      setAll((d.rows ?? []).map((x: ApiRow) => ({ id: x.id, name: x.name, description: x.description || "", sku: x.sku, kind: x.kind, price: Number(x.unitPrice) || 0, vat: Number(x.vatRate) || 0, category: x.category, recurring: !!x.recurring, active: !!x.active })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const loadCats = React.useCallback(() => { fetch("/api/books/item-categories").then((r) => r.json()).then((d) => setCats(d.rows ?? [])).catch(() => {}); }, []);
  React.useEffect(() => { load(); loadCats(); }, [load, loadCats]);

  const filtered = all.filter((r) =>
    (kindFilter === "ALL" || (r.kind || "").toUpperCase() === kindFilter)
    && (catFilter === "ALL" || (r.category || "") === catFilter)
    && ((r.name || "") + (r.sku || "") + (r.category || "")).toLowerCase().includes(q.toLowerCase()));
  const services = all.filter((r) => (r.kind || "").toUpperCase() === "SERVICE").length;

  function openNew() { setErr(""); setDraft({ ...EMPTY, category: catFilter !== "ALL" ? catFilter : "" }); }
  function openEdit(r: Row) {
    setErr("");
    setDraft({ id: r.id, name: r.name, kind: (r.kind || "SERVICE").toUpperCase(), sku: r.sku, category: r.category, description: r.description, unitPrice: String(r.price), vatRate: String(r.vat), recurring: r.recurring, active: r.active });
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr("");
    const payload = {
      name: draft.name.trim(), kind: draft.kind, sku: draft.sku.trim() || null, category: draft.category.trim() || null,
      description: draft.description.trim() || null, unitPrice: Number(draft.unitPrice) || 0, vatRate: Number(draft.vatRate) || 0,
      recurring: draft.recurring, active: draft.active,
    };
    const res = draft.id
      ? await fetch(`/api/books/items/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`/api/books/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.error || "Save failed"); return; }
    const cat = draft.category.trim();
    if (cat && !cats.some((c) => c.name.toLowerCase() === cat.toLowerCase())) {
      await fetch("/api/books/item-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: cat }) }).catch(() => {});
      loadCats();
    }
    setDraft(null); load();
  }

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/books/items/${r.id}`, { method: "DELETE" });
    if (res.ok) load();
    else { const d = await res.json().catch(() => ({})); alert(d.error || "Delete failed"); }
  }

  async function createCat() {
    if (!catDraft.name.trim()) { setCatErr("Name is required"); return; }
    setCatBusy(true); setCatErr("");
    const r = await fetch("/api/books/item-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catDraft) });
    setCatBusy(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setCatErr(d.error || "Failed"); return; }
    setCatDraft({ name: "", industry: "", itemType: "" }); loadCats();
  }
  async function removeCat(c: Cat) {
    if (!confirm(`Delete category "${c.name}"? Items keep their label.`)) return;
    const r = await fetch(`/api/books/item-categories?id=${c.id}`, { method: "DELETE" });
    if (r.ok) loadCats();
  }

  // Bulk import (name, price, vat, kind, description)
  const parseBulk = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .filter((l, i) => !(i === 0 && /name/i.test(l) && /price/i.test(l)))
    .map((line) => {
      const parts = line.includes(";") ? line.split(";") : line.includes("\t") ? line.split("\t") : line.split(",");
      const name = (parts[0] ?? "").trim();
      const unitPrice = (parts[1] ?? "").trim();
      const vatRate = (parts[2] ?? "5").trim() || "5";
      const kind = (parts[3] ?? "SERVICE").trim() || "SERVICE";
      const description = (parts[4] ?? "").trim();
      return { name, unitPrice, vatRate, kind, description };
    });
  const bulkRows = parseBulk(bulkText);
  const bulkValid = bulkRows.filter((r) => r.name && !isNaN(parseFloat(r.unitPrice)) && parseFloat(r.unitPrice) >= 0);
  async function runBulk() {
    setBulkBusy(true);
    const r = await fetch("/api/books/items/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: bulkRows }) });
    setBulkBusy(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { alert(d.error || "Import failed"); return; }
    setBulkOpen(false); setBulkText(""); load();
  }

  const COLS: Column<Row>[] = [
    { key: "name", header: "Item", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span>{r.sku ? <span style={{ color: color.ink.soft, fontSize: 12, marginLeft: 8 }}>{r.sku}</span> : null}</span> },
    { key: "kind", header: "Type", width: 104, render: (r) => <StatusBadge tone={(r.kind || "").toUpperCase() === "SERVICE" ? "info" : "neutral"} label={(r.kind || "").toLowerCase() || "—"} /> },
    { key: "category", header: "Category", render: (r) => <span style={{ color: r.category ? color.ink.mid : color.ink.soft }}>{r.category || "—"}</span> },
    { key: "vat", header: "VAT", width: 66, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{Number(r.vat) || 0}%</span> },
    { key: "price", header: "Unit price", width: 116, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.price)}</span> },
    { key: "active", header: "Status", width: 86, render: (r) => <StatusBadge tone={r.active ? "positive" : "neutral"} label={r.active ? "active" : "inactive"} /> },
    { key: "id", header: "", width: 120, align: "right", render: (r) => (
      <span style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={() => openEdit(r)} style={{ fontSize: 12, fontWeight: 600, color: color.brand.primary, background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px" }}>Edit</button>
        <button onClick={() => remove(r)} style={{ fontSize: 12, fontWeight: 600, color: color.status.negative, background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px" }}>Delete</button>
      </span>
    ) },
  ];

  const chip = (active: boolean): React.CSSProperties => ({ padding: "5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${active ? color.brand.primary : color.line.strong}`, background: active ? color.brand.primary : color.surface.card, color: active ? color.ink.onPrimary : color.ink.mid });

  return (
    <AppShell active="products">
      <PageTitleRow title="Items & Services" subtitle={`${all.length} items · ${cats.length} categories`} actions={
        <span style={{ display: "inline-flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => { setCatErr(""); setCatOpen(true); }}>Manage categories</Button>
          <ExportMenu entity="items" /><Button variant="secondary" onClick={() => setBulkOpen(true)}>Import</Button>
          <Button variant="primary" onClick={openNew}>+ New item</Button>
        </span>
      } />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Items" value={String(all.length)} note="in catalog" noteTone={color.brand.primary} />
        <KPICard label="Services" value={String(services)} note="service items" noteTone={color.status.info} />
        <KPICard label="Products" value={String(all.length - services)} note="goods" noteTone={color.ink.soft} />
        <KPICard label="Categories" value={String(cats.length)} note="for organisation" noteTone={color.status.positive} />
      </div>

      {/* Category filter chips */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <span style={chip(catFilter === "ALL")} onClick={() => setCatFilter("ALL")}>All categories</span>
        {cats.map((c) => <span key={c.id} style={chip(catFilter === c.name)} onClick={() => setCatFilter(c.name)}>{c.name}{c.industry ? ` · ${c.industry}` : ""} <span style={{ opacity: 0.7 }}>{c.itemCount}</span></span>)}
        {cats.length === 0 ? <span style={{ fontSize: 12, color: color.ink.soft }}>No categories yet — “Manage categories” to organise by industry (e.g. Real Estate, Healthcare).</span> : null}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search item, SKU, category…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 320 }} />
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "ALL" | "SERVICE" | "PRODUCT")} style={{ ...selectStyle, width: 160 }}>
          <option value="ALL">All types</option>
          <option value="SERVICE">Services</option>
          <option value="PRODUCT">Products</option>
        </select>
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : filtered.length === 0 ? <EmptyState title={all.length === 0 ? "No items yet" : "No matches"} hint={all.length === 0 ? "Add services and products you sell. Group them with categories by industry — they become line items on quotes and invoices." : "Try a different search, type or category."} action={<Button variant="primary" onClick={all.length === 0 ? openNew : () => { setQ(""); setKindFilter("ALL"); setCatFilter("ALL"); }}>{all.length === 0 ? "+ New item" : "Clear filters"}</Button>} />
          : <DataTable columns={COLS} rows={filtered} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Items &amp; Services · categories &amp; live catalog · tenant-scoped</p>

      {/* New / Edit item modal */}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit item" : "New item"} size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : draft?.id ? "Save changes" : "Create item"}</Button>
        </>}>
        {draft && (
          <div style={{ display: "grid", gap: 12 }}>
            {err && <div style={{ fontSize: 13, color: color.status.negative, background: "#FEF2F2", border: `1px solid ${color.status.negative}33`, borderRadius: 8, padding: "8px 10px" }}>{err}</div>}
            <div>
              <label style={fieldLabel}>Name *</label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. DHA Consultation" autoFocus />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Type</label>
                <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} style={selectStyle}>
                  <option value="SERVICE">Service</option>
                  <option value="PRODUCT">Product</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>SKU / code</label>
                <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} placeholder="optional" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={fieldLabel}>Unit price (AED)</label>
                <Input type="number" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label style={fieldLabel}>VAT %</label>
                <Input type="number" value={draft.vatRate} onChange={(e) => setDraft({ ...draft, vatRate: e.target.value })} placeholder="5" />
              </div>
              <div>
                <label style={fieldLabel}>Category</label>
                <Input value={draft.category} list="item-cats" onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="pick or type new" />
                <datalist id="item-cats">{cats.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Description</label>
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} placeholder="Shown on quotes & invoices" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, fontSize: 14, color: color.ink.DEFAULT, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: color.ink.mid, cursor: "pointer" }}>
                <input type="checkbox" checked={draft.recurring} onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })} /> Recurring / subscription
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: color.ink.mid, cursor: "pointer" }}>
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active (sellable)
              </label>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage categories modal */}
      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="Categories" size="md"
        footer={<Button variant="secondary" onClick={() => setCatOpen(false)}>Done</Button>}>
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ fontSize: 13, color: color.ink.mid, margin: 0 }}>Organise items & services into categories by industry — e.g. <strong>Real Estate</strong>, <strong>Healthcare</strong> — so larger catalogs stay tidy.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.9fr auto", gap: 8, alignItems: "end" }}>
            <div><label style={fieldLabel}>New category</label><Input value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} placeholder="e.g. Property listings" /></div>
            <div><label style={fieldLabel}>Industry</label><Input value={catDraft.industry} list="industries" onChange={(e) => setCatDraft({ ...catDraft, industry: e.target.value })} placeholder="optional" /><datalist id="industries">{INDUSTRIES.map((i) => <option key={i} value={i} />)}</datalist></div>
            <div><label style={fieldLabel}>For</label><select value={catDraft.itemType} onChange={(e) => setCatDraft({ ...catDraft, itemType: e.target.value })} style={selectStyle}><option value="">Any</option><option value="SERVICE">Services</option><option value="PRODUCT">Products</option></select></div>
            <Button variant="primary" onClick={createCat} disabled={catBusy}>{catBusy ? "…" : "Add"}</Button>
          </div>
          {catErr && <div style={{ fontSize: 13, color: color.status.negative }}>{catErr}</div>}
          <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, maxHeight: 280, overflowY: "auto" }}>
            {cats.length === 0 ? <div style={{ padding: 18, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No categories yet.</div>
              : cats.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{c.name}</span>
                  {c.industry ? <StatusBadge tone="info" label={c.industry} /> : null}
                  <span style={{ fontSize: 12, color: color.ink.soft, width: 60, textAlign: "right" }}>{c.itemCount} item{c.itemCount === 1 ? "" : "s"}</span>
                  <button onClick={() => removeCat(c)} aria-label="Delete" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.status.negative, cursor: "pointer" }}>×</button>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      {/* Bulk import modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Import items & services" size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={runBulk} disabled={bulkBusy || bulkValid.length === 0}>{bulkBusy ? "Importing…" : `Import ${bulkValid.length} item${bulkValid.length === 1 ? "" : "s"}`}</Button>
        </>}>
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ fontSize: 13, color: color.ink.mid, margin: 0 }}>One item per line: <code style={{ background: color.surface.sunken, padding: "1px 5px", borderRadius: 4 }}>name, price, vat, type, description</code>. Type is SERVICE or PRODUCT (defaults to SERVICE). Comma, semicolon or tab separated.</p>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={10}
            placeholder={"DHA Consultation, 350, 5, SERVICE, Initial consult\nBlood panel, 220, 5, SERVICE\nThermometer, 45, 5, PRODUCT"}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, fontSize: 13, fontFamily: "ui-monospace, monospace", color: color.ink.DEFAULT, resize: "vertical" }} />
          <div style={{ fontSize: 12, color: color.ink.soft }}>{bulkRows.length} line{bulkRows.length === 1 ? "" : "s"} · {bulkValid.length} valid{bulkRows.length - bulkValid.length > 0 ? ` · ${bulkRows.length - bulkValid.length} skipped` : ""}</div>
        </div>
      </Modal>
    </AppShell>
  );
}
