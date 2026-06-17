"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Campaign = { id: string; name: string; status: string; createdAt: string; audience: number; sent: number; opens: number; replies: number };

const TONE: Record<string, BadgeTone> = { ACTIVE: "positive", DRAFT: "neutral", PAUSED: "warning", COMPLETED: "info" };
const openRate = (c: Campaign) => c.sent > 0 ? Math.round((c.opens / c.sent) * 100) : 0;

const FILTERS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "active", label: "Active", match: (s) => s === "ACTIVE" },
  { id: "draft", label: "Draft", match: (s) => s === "DRAFT" },
  { id: "completed", label: "Completed", match: (s) => s === "COMPLETED" || s === "PAUSED" },
];

export default function CampaignsPage() {
  const [all, setAll] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");

  React.useEffect(() => {
    fetch("/api/campaigns").then((r) => r.json()).then((d) => { setAll(d.campaigns ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = all.filter((c) => active.match(c.status)).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const kpis = {
    total: all.length,
    active: all.filter((c) => c.status === "ACTIVE").length,
    audience: all.reduce((s, c) => s + (c.audience || 0), 0),
    avgOpen: (() => { const withSent = all.filter((c) => c.sent > 0); return withSent.length ? Math.round(withSent.reduce((s, c) => s + openRate(c), 0) / withSent.length) : 0; })(),
  };

  const COLUMNS: Column<Campaign>[] = [
    { key: "name", header: "Campaign", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status] ?? "neutral"} label={r.status.toLowerCase()} /> },
    { key: "audience", header: "Audience", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.audience.toLocaleString()}</span> },
    { key: "sent", header: "Sent", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.sent.toLocaleString()}</span> },
    { key: "open", header: "Open rate", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600, color: openRate(r) >= 40 ? color.status.positive : color.ink.mid }}>{openRate(r)}%</span> },
    { key: "replies", header: "Replies", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.replies}</span> },
  ];

  return (
    <AppShell active="campaigns">
      <PageTitleRow title="Campaigns" subtitle={`${all.length} campaigns`} actions={<Button variant="primary">+ New campaign</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Campaigns" value={String(kpis.total)} note="total" noteTone={color.brand.primary} />
        <KPICard label="Active" value={String(kpis.active)} note="running now" noteTone={color.status.positive} />
        <KPICard label="Audience" value={kpis.audience.toLocaleString()} note="leads enrolled" noteTone={color.ink.soft} />
        <KPICard label="Avg open rate" value={`${kpis.avgOpen}%`} note="across sent" noteTone={kpis.avgOpen >= 40 ? color.status.positive : color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search campaigns…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = filt === f.id;
          return (
            <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {f.label}{f.id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{all.filter((c) => f.match(c.status)).length}</span> : null}
            </button>
          );
        })}
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No campaigns" hint="Email campaigns for your workspace will appear here." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
          : <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Campaigns · live email campaigns + open/reply stats via DataPort · tenant-scoped</p>
    </AppShell>
  );
}
