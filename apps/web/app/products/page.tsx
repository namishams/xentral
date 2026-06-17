"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column, type BadgeTone } from "@xentral/ui";
import { listProducts, type Product } from "@xentral/module-erp";

const ALL = listProducts();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
function stockBadge(stock: number): { tone: BadgeTone; label: string } {
  if (stock === 0) return { tone: "critical", label: "out of stock" };
  if (stock < 10) return { tone: "warning", label: `low · ${stock}` };
  return { tone: "positive", label: stock >= 999 ? "service" : `${stock} in stock` };
}

const COLUMNS: Column<Product>[] = [
  { key: "sku", header: "SKU", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.sku}</span> },
  { key: "name", header: "Name", render: (r) => r.name },
  { key: "category", header: "Category", width: 120, render: (r) => <span style={{ color: color.ink.mid }}>{r.category}</span> },
  { key: "stock", header: "Stock", width: 130, render: (r) => { const b = stockBadge(r.stock); return <StatusBadge tone={b.tone} label={b.label} />; } },
  { key: "price", header: "Price", width: 110, align: "right", render: (r) => aed(r.price) },
];

export default function ProductsPage() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = ALL.filter((r) => (r.sku + r.name + r.category).toLowerCase().includes(q.toLowerCase()));
  const lowStock = ALL.filter((r) => r.stock < 10).length;

  return (
    <AppShell active="products">
      <PageTitleRow
        title="Products"
        subtitle={`${ALL.length} items · ${lowStock} need attention`}
        actions={<Button variant="primary">+ New product</Button>}
      />
      <FilterBar>
        <Input placeholder="Search products…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 240 }} />
        <Button>Category</Button>
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No products match your search" hint="Try a different SKU, name or category." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Rows from @xentral/module-erp · third module data-source · pure composition</p>
    </AppShell>
  );
}
