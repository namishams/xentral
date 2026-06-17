"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type Cat = { id: string; name: string; kind: "Income" | "Expense" | "Item"; items: number; account: string };
const CATS: Cat[] = [
  { id: "c1", name: "Services", kind: "Income", items: 18, account: "4000 Sales revenue" },
  { id: "c2", name: "Hardware", kind: "Item", items: 64, account: "4010 Product sales" },
  { id: "c3", name: "Marketing", kind: "Expense", items: 12, account: "5200 Marketing" },
  { id: "c4", name: "Subcontractors", kind: "Expense", items: 7, account: "5100 Cost of sales" },
  { id: "c5", name: "Office & admin", kind: "Expense", items: 23, account: "5300 Overheads" },
];
const TONE = { Income: "positive", Expense: "critical", Item: "info" } as const;
const COLS: Column<Cat>[] = [
  { key: "name", header: "Category", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "kind", header: "Kind", width: 110, render: (r) => <StatusBadge tone={TONE[r.kind] as BadgeTone} label={r.kind} /> },
  { key: "items", header: "Items", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.items}</span> },
  { key: "account", header: "Mapped account", render: (r) => <span style={{ color: color.ink.soft }}>{r.account}</span> },
];

export default function CategoriesPage() {
  return (
    <AppShell active="categories">
      <PageTitleRow title="Categories" subtitle="Item and accounting categories — drive automatic posting" actions={<Button variant="primary">+ New category</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Categories" value={String(CATS.length)} note="configured" noteTone={color.ink.soft} />
        <KPICard label="Income" value={String(CATS.filter((c) => c.kind === "Income").length)} note="revenue lines" noteTone={color.status.positive} />
        <KPICard label="Expense" value={String(CATS.filter((c) => c.kind === "Expense").length)} note="cost lines" noteTone={color.status.critical} />
        <KPICard label="Mapped" value="100%" note="to GL accounts" noteTone={color.ink.soft} />
      </div>
      <DataTable columns={COLS} rows={CATS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Categories · account determination · tokens-only, theme-aware</p>
    </AppShell>
  );
}
