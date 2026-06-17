"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type Branch = { id: string; name: string; type: "HQ" | "Branch" | "Warehouse"; emirate: string; staff: number; status: "active" | "setup" };
const BRANCHES: Branch[] = [
  { id: "br1", name: "ICSL HQ — Business Bay", type: "HQ", emirate: "Dubai", staff: 16, status: "active" },
  { id: "br2", name: "Abu Dhabi Office", type: "Branch", emirate: "Abu Dhabi", staff: 6, status: "active" },
  { id: "br3", name: "Sharjah Branch", type: "Branch", emirate: "Sharjah", staff: 3, status: "setup" },
  { id: "br4", name: "Dubai Main DC", type: "Warehouse", emirate: "Dubai", staff: 8, status: "active" },
];
const TONE: Record<Branch["status"], BadgeTone> = { active: "positive", setup: "warning" };
const TYPE_TONE = { HQ: "info", Branch: "neutral", Warehouse: "warning" } as const;

const COLS: Column<Branch>[] = [
  { key: "name", header: "Location", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "type", header: "Type", width: 120, render: (r) => <StatusBadge tone={TYPE_TONE[r.type]} label={r.type} /> },
  { key: "emirate", header: "Emirate", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.emirate}</span> },
  { key: "staff", header: "Staff", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.staff}</span> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function BranchesPage() {
  return (
    <AppShell active="branches">
      <PageTitleRow title="Branches & Locations" subtitle="Multi-branch org structure — scope data and reporting per location" actions={<Button variant="primary">+ New location</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Locations" value={String(BRANCHES.length)} note="total" noteTone={color.ink.soft} />
        <KPICard label="Active" value={String(BRANCHES.filter((b) => b.status === "active").length)} note="operational" noteTone={color.status.positive} />
        <KPICard label="Emirates" value={String(new Set(BRANCHES.map((b) => b.emirate)).size)} note="coverage" noteTone={color.ink.soft} />
        <KPICard label="Total staff" value={String(BRANCHES.reduce((s, b) => s + b.staff, 0))} note="across locations" noteTone={color.ink.soft} />
      </div>
      <DataTable columns={COLS} rows={BRANCHES} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Branches & locations · tokens-only, theme-aware</p>
    </AppShell>
  );
}
