"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Row = { id: string; number: string; customer: string; status: string; total: number; currency: string; valid: string | null };
const aed = (n: number) => `AED ${Math.round(n || 0).toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`;
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", ACCEPTED: "positive", REJECTED: "critical", EXPIRED: "neutral", INVOICED: "positive" };
const initials = (s: string) => s.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const FILTERS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "open", label: "Open", match: (s) => s === "DRAFT" || s === "SENT" },
  { id: "accepted", label: "Accepted", match: (s) => s === "ACCEPTED" || s === "INVOICED" },
  { id: "closed", label: "Closed", match: (s) => s === "REJECTED" || s === "EXPIRED" },
];

export default function QuotationsPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");
  React.useEffect(() => { fetch("/api/books/quotes").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const up = (s: string) => (s || "").toUpperCase();
  const rows = all.filter((r) => active.match(up(r.status))).filter((r) => (r.number + " " + r.customer).toLowerCase().includes(q.toLowerCase()));
  const openValue = all.filter((r) => up(r.status) === "DRAFT" || up(r.status) === "SENT").reduce((s, r) => s + (r.total || 0), 0);
  const acc = all.filter((r) => up(r.status) === "ACCEPTED" || up(r.status) === "INVOICED").length;
  const closed = all.filter((r) => up(r.status) === "REJECTED" || up(r.status) === "EXPIRED").length;
  const winRate = acc + closed > 0 ? Math.round((acc / (acc + closed)) * 100) : 0;

  const COLS: Column<Row>[] = [
    { key: "number", header: "Quote", width: 120, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
    { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.customer || "?")}</span><span style={{ color: color.ink.DEFAULT }}>{r.customer || "—"}</span></span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[up(r.status)] ?? "neutral"} label={(r.status || "").toLowerCase()} /> },
    { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
    { key: "valid", header: "Valid until", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.valid || "—"}</span> },
  ];

  return (
    <AppShell active="quotations">
      <PageTitleRow title="Quotes" subtitle={`${all.length} quotes · ${aed(openValue)} open`} actions={<Button variant="primary" onClick={() => { window.location.href = "/quotations/new"; }}>+ New quote</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Quotes" value={String(all.length)} note="issued" noteTone={color.brand.primary} />
        <KPICard label="Open value" value={aedShort(openValue)} note="awaiting reply" noteTone={color.status.info} />
        <KPICard label="Accepted" value={String(acc)} note="won" noteTone={color.status.positive} />
        <KPICard label="Win rate" value={`${winRate}%`} note="accepted vs closed" noteTone={winRate >= 50 ? color.status.positive : color.status.critical} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search quote or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => { const on = filt === f.id; return <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>{f.label}</button>; })}
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No quotes" hint="Quotes for your workspace appear here." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/quotations/${r.id}`} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Quotes · live via API · tenant-scoped</p>
    </AppShell>
  );
}
