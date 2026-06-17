"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Row = { id: string; number: string; customer: string; status: string; total: number; amountPaid: number; currency: string; due: string | null };
const aed = (n: number) => `AED ${Math.round(n || 0).toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`;
const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral", OVERDUE: "critical" };
const bal = (r: Row) => Math.max(0, (r.total || 0) - (r.amountPaid || 0));
const initials = (s: string) => s.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const FILTERS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "draft", label: "Drafts", match: (s) => s === "DRAFT" },
  { id: "open", label: "Outstanding", match: (s) => s === "SENT" || s === "PARTIALLY_PAID" || s === "OVERDUE" },
  { id: "paid", label: "Paid", match: (s) => s === "PAID" },
];

export default function InvoicesPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");
  React.useEffect(() => { fetch("/api/books/invoices").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = all.filter((r) => active.match((r.status || "").toUpperCase())).filter((r) => (r.number + " " + r.customer).toLowerCase().includes(q.toLowerCase()));
  const outstanding = all.reduce((s, r) => s + bal(r), 0);
  const collected = all.reduce((s, r) => s + (r.amountPaid || 0), 0);

  const COLS: Column<Row>[] = [
    { key: "number", header: "Number", width: 120, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
    { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.customer || "?")}</span><span style={{ color: color.ink.DEFAULT }}>{r.customer || "—"}</span></span> },
    { key: "status", header: "Status", width: 130, render: (r) => <StatusBadge tone={TONE[(r.status || "").toUpperCase()] ?? "neutral"} label={(r.status || "").replace("_", " ").toLowerCase()} /> },
    { key: "total", header: "Total", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
    { key: "balance", header: "Balance", width: 110, align: "right", render: (r) => <span style={{ color: bal(r) > 0 ? color.status.critical : color.ink.soft }}>{aed(bal(r))}</span> },
    { key: "due", header: "Due", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.due || "—"}</span> },
  ];

  return (
    <AppShell active="invoice">
      <PageTitleRow title="Invoices" subtitle={`${all.length} invoices · ${aed(outstanding)} outstanding`} actions={<Button variant="primary">+ New invoice</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Invoices" value={String(all.length)} note="issued" noteTone={color.brand.primary} />
        <KPICard label="Outstanding" value={aedShort(outstanding)} note="to collect" noteTone={color.status.critical} />
        <KPICard label="Collected" value={aedShort(collected)} note="paid in" noteTone={color.status.positive} />
        <KPICard label="Customers" value={String(new Set(all.map((r) => r.customer)).size)} note="billed" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search number or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => { const on = filt === f.id; return <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>{f.label}</button>; })}
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No invoices" hint="Invoices for your workspace appear here." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/invoices/${r.id}`} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Invoices · live via API · tenant-scoped</p>
    </AppShell>
  );
}
