"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type PL = { id: string; name: string; currency: string; items: number; adjustment: string; status: "active" | "draft" };
const LISTS: PL[] = [
  { id: "pl1", name: "Standard (retail)", currency: "AED", items: 240, adjustment: "List price", status: "active" },
  { id: "pl2", name: "VIP / Key accounts", currency: "AED", items: 240, adjustment: "−10%", status: "active" },
  { id: "pl3", name: "Wholesale", currency: "AED", items: 180, adjustment: "−22%", status: "active" },
  { id: "pl4", name: "Export (USD)", currency: "USD", items: 95, adjustment: "FX + 5%", status: "draft" },
];
const TONE: Record<PL["status"], BadgeTone> = { active: "positive", draft: "neutral" };

const COLS: Column<PL>[] = [
  { key: "name", header: "Price list", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "currency", header: "Currency", width: 100, render: (r) => <StatusBadge tone="info" label={r.currency} /> },
  { key: "items", header: "Items", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.items}</span> },
  { key: "adjustment", header: "Adjustment", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.adjustment}</span> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function PriceListsPage() {
  return (
    <AppShell active="price-lists">
      <PageTitleRow title="Price Lists" subtitle="Customer-specific and channel pricing" actions={<Button variant="primary">+ New price list</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Price lists" value={String(LISTS.length)} note="configured" noteTone={color.ink.soft} />
        <KPICard label="Active" value={String(LISTS.filter((l) => l.status === "active").length)} note="in use" noteTone={color.status.positive} />
        <KPICard label="Currencies" value={String(new Set(LISTS.map((l) => l.currency)).size)} note="AED · USD" noteTone={color.ink.soft} />
        <KPICard label="Priced items" value="240" note="catalog coverage" noteTone={color.ink.soft} />
      </div>
      <DataTable columns={COLS} rows={LISTS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Price lists · locked KPICard + DataTable · tokens-only, theme-aware</p>
    </AppShell>
  );
}
