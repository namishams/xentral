"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listProducts, type Product } from "@xentral/module-erp";

const ALL = listProducts();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
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

export default function ProductsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.sku + r.name + r.category).toLowerCase().includes(q.toLowerCase()));
  const lowStock = ALL.filter((r) => r.stock < 10).length;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="products">
      <PageTitleRow
        title="Products"
        subtitle={`${ALL.length} items · ${lowStock} need attention`}
        actions={<Button variant="primary">+ New product</Button>}
      />
      <FilterBar>
        <Input placeholder="Search SKU, name, category…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button>Category</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No products match your search" hint="Try a different SKU, name or category." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Grouped by stock status · @xentral/module-erp · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
