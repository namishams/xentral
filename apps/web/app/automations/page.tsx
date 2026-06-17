"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, KPICard, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Flow = { id: string; name: string; trigger: string; action: string; status: "active" | "paused" | "draft"; runs: number };
const FLOWS: Flow[] = [
  { id: "f1", name: "New WhatsApp lead → qualify + assign", trigger: "WhatsApp message", action: "AI score → create lead → assign rep", status: "active", runs: 482 },
  { id: "f2", name: "Quote accepted → create invoice", trigger: "Quote accepted", action: "Convert to invoice → email customer", status: "active", runs: 96 },
  { id: "f3", name: "Invoice overdue → reminder", trigger: "Invoice 3 days overdue", action: "Send WhatsApp + email reminder", status: "active", runs: 134 },
  { id: "f4", name: "Payment received → receipt + thank you", trigger: "Payment received", action: "Send receipt PDF → Slack ping", status: "paused", runs: 210 },
  { id: "f5", name: "New deal won → onboarding", trigger: "Deal stage = Won", action: "Create project → tasks → welcome email", status: "draft", runs: 0 },
];
const TONE: Record<Flow["status"], BadgeTone> = { active: "positive", paused: "warning", draft: "neutral" };

export default function AutomationsPage() {
  const [q, setQ] = React.useState("");
  const rows = FLOWS.filter((f) => (f.name + f.trigger + f.action).toLowerCase().includes(q.toLowerCase()));
  const COLS: Column<Flow>[] = [
    { key: "name", header: "Automation", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>When: {r.trigger} → {r.action}</span></span> },
    { key: "runs", header: "Runs", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.runs.toLocaleString()}</span> },
    { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  ];
  const active = FLOWS.filter((f) => f.status === "active").length;
  const totalRuns = FLOWS.reduce((s, f) => s + f.runs, 0);
  return (
    <AppShell active="automations">
      <PageTitleRow title="Automations" subtitle="No-code flows — trigger to action across the whole platform" actions={<Button variant="primary">+ New automation</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Active flows" value={String(active)} note={`of ${FLOWS.length}`} noteTone={color.status.positive} />
        <KPICard label="Runs (30d)" value={totalRuns.toLocaleString()} note="executions" noteTone={color.ink.soft} />
        <KPICard label="Time saved" value="~38h" note="estimated / month" noteTone={color.status.positive} />
        <KPICard label="Connectors" value="8" note="available" noteTone={color.ink.soft} />
      </div>
      <FilterBar><Input placeholder="Search automations…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} /></FilterBar>
      {rows.length === 0 ? <EmptyState title="No automations match" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear</Button>} /> : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Automations · trigger → action flows · tokens-only, theme-aware</p>
    </AppShell>
  );
}
