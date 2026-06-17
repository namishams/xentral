"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listProducts, type Product } from "@xentral/module-erp";

const ALL = listProducts();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${n}`;
function stockBadge(stock: number): { tone: BadgeTone; label: string } {
  if (stock === 0) return { tone: "critical", label: "out of stock" };
  if (stock < 10) return { tone: "warning", label: `low · ${stock}` };
  return { tone: "positive", label: stock >= 999 ? "service" : `${stock} in stock` };
}

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<Product>[] = [
  { key: "sku", header: "SKU", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.sku}</span> },
  { key: "name", header: "Name", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.name} /><span style={{ color: color.ink.DEFAULT }}>{r.name}</span></span> },
  { key: "category", header: "Category", width: 120, render: (r) => <span style={{ color: color.ink.mid }}>{r.category}</span> },
  { key: "stock", header: "Stock", width: 130, render: (r) => { const b = stockBadge(r.stock); return <StatusBadge tone={b.tone} label={b.label} />; } },
  { key: "price", header: "Price", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.price)}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (p: Product) => boolean }[] = [
  { id: "attention", title: "Needs attention", accent: color.status.critical, match: (p) => p.stock < 10 },
  { id: "stock", title: "In stock", accent: color.status.positive, match: (p) => p.stock >= 10 && p.stock < 999 },
  { id: "services", title: "Services", accent: color.status.info, match: (p) => p.stock >= 999 },
];

const FILTERS: { id: string; label: string; match: (p: Product) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "attention", label: "Needs attention", match: (p) => p.stock < 10 },
  { id: "stock", label: "In stock", match: (p) => p.stock >= 10 && p.stock < 999 },
  { id: "services", label: "Services", match: (p) => p.stock >= 999 },
];

export default function ProductsPage() {
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");
  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = ALL.filter((r) => active.match(r)).filter((r) => (r.sku + r.name + r.category).toLowerCase().includes(q.toLowerCase()));
  const lowStock = ALL.filter((r) => r.stock < 10).length;
  const inStock = ALL.filter((r) => r.stock >= 10 && r.stock < 999).length;
  const services = ALL.filter((r) => r.stock >= 999).length;
  const invValue = ALL.filter((r) => r.stock < 999).reduce((s, r) => s + r.price * r.stock, 0);
  const categories = new Set(ALL.map((r) => r.category)).size;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="products">
      <PageTitleRow title="Products" subtitle={`${ALL.length} items · ${lowStock} need attention`} actions={<Button variant="primary">+ New product</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Items" value={String(ALL.length)} note="in catalog" noteTone={color.brand.primary} />
        <KPICard label="In stock" value={String(inStock)} note="stocked goods" noteTone={color.status.positive} />
        <KPICard label="Needs attention" value={String(lowStock)} note="low / out" noteTone={color.status.critical} />
        <KPICard label="Services" value={String(services)} note="non-stock" noteTone={color.status.info} />
        <KPICard label="Stock value" value={aedShort(invValue)} note="at list price" noteTone={color.ink.soft} />
        <KPICard label="Categories" value={String(categories)} note="segments" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search SKU, name, category…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = filt === f.id;
          return (
            <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {f.label}{f.id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ALL.filter((r) => f.match(r)).length}</span> : null}
            </button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No products match your filters" hint="Try a different SKU, name or category." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 4 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/products/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · grouped by stock health · locked DataTable + StatusBadge · tokens-only</p>
    </AppShell>
  );
}
