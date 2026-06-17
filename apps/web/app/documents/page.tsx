"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, KPICard, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Doc = { id: string; name: string; type: "Invoice" | "Quote" | "Contract" | "Licence"; owner: string; size: string; date: string; shared: boolean };
const ALL: Doc[] = [
  { id: "d1", name: "INV-1043.pdf", type: "Invoice", owner: "Nami", size: "82 KB", date: "17 Jun", shared: true },
  { id: "d2", name: "Q-3009 — Damac.pdf", type: "Quote", owner: "Omar", size: "120 KB", date: "16 Jun", shared: true },
  { id: "d3", name: "MSA — Skyline.pdf", type: "Contract", owner: "Nami", size: "340 KB", date: "12 Jun", shared: false },
  { id: "d4", name: "Trade licence 2026.pdf", type: "Licence", owner: "Lena", size: "210 KB", date: "02 Jun", shared: false },
];
const TYPE_TONE = { Invoice: "info", Quote: "warning", Contract: "neutral", Licence: "positive" } as const;

export default function DocumentsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((d) => (d.name + d.type + d.owner).toLowerCase().includes(q.toLowerCase()));
  const COLS: Column<Doc>[] = [
    { key: "name", header: "Document", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: 6, background: color.surface.sunken, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>▦</span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span></span> },
    { key: "type", header: "Type", width: 120, render: (r) => <StatusBadge tone={TYPE_TONE[r.type]} label={r.type} /> },
    { key: "owner", header: "Owner", width: 100, render: (r) => <span style={{ color: color.ink.mid }}>{r.owner}</span> },
    { key: "shared", header: "Sharing", width: 110, render: (r) => <StatusBadge tone={r.shared ? "positive" : "neutral"} label={r.shared ? "shared" : "private"} /> },
    { key: "date", header: "Date", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.date}</span> },
  ];
  return (
    <AppShell active="documents">
      <PageTitleRow title="Documents" subtitle="Every file across the workspace — invoices, contracts, licences" actions={<Button variant="primary">Upload</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Documents" value={String(ALL.length)} note="stored" noteTone={color.ink.soft} />
        <KPICard label="Shared" value={String(ALL.filter((d) => d.shared).length)} note="with customers" noteTone={color.status.positive} />
        <KPICard label="Storage" value="0.7 GB" note="of 25 GB" noteTone={color.ink.soft} />
        <KPICard label="Types" value={String(new Set(ALL.map((d) => d.type)).size)} note="categories" noteTone={color.ink.soft} />
      </div>
      <FilterBar><Input placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} /></FilterBar>
      {rows.length === 0 ? <EmptyState title="No documents match" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear</Button>} /> : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Documents library · tokens-only, theme-aware</p>
    </AppShell>
  );
}
