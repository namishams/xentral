"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type Store = { id: string; name: string; platform: string; orders: number; products: number; status: "synced" | "syncing" | "error" };
const STORES: Store[] = [
  { id: "s1", name: "icsl-store.myshopify.com", platform: "Shopify", orders: 312, products: 180, status: "synced" },
  { id: "s2", name: "shop.icsl.ae", platform: "WooCommerce", orders: 94, products: 120, status: "syncing" },
  { id: "s3", name: "Amazon.ae seller", platform: "Amazon", orders: 41, products: 60, status: "error" },
];
const TONE: Record<Store["status"], BadgeTone> = { synced: "positive", syncing: "info", error: "critical" };
const COLS: Column<Store>[] = [
  { key: "name", header: "Store", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.platform}</span></span> },
  { key: "orders", header: "Orders (30d)", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.orders}</span> },
  { key: "products", header: "Products", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.products}</span> },
  { key: "status", header: "Sync", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function CommercePage() {
  const orders = STORES.reduce((s, x) => s + x.orders, 0);
  return (
    <AppShell active="commerce">
      <PageTitleRow title="Commerce" subtitle="Connected sales channels — orders and catalog sync" actions={<Button variant="primary">+ Connect store</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Channels" value={String(STORES.length)} note="connected" noteTone={color.ink.soft} />
        <KPICard label="Orders (30d)" value={String(orders)} note="imported" noteTone={color.status.positive} />
        <KPICard label="Catalog synced" value="360" note="products mapped" noteTone={color.ink.soft} />
        <KPICard label="Sync health" value="2/3 OK" note="1 needs attention" noteTone={color.status.critical} />
      </div>
      <DataTable columns={COLS} rows={STORES} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Commerce connectors · Shopify · WooCommerce · Amazon · tokens-only, theme-aware</p>
    </AppShell>
  );
}
