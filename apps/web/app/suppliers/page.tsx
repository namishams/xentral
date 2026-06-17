"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { NewCrmButton } from "../../components/crm-quick-create";

type Row = { id: string; name: string; email: string | null; phone: string | null; currency: string | null; active: boolean };
const ACCENTS = ["#0064d9", "#188918", "#9a5800", "#0e7490", "#6b3fd4", "#b3261e"];
const accentFor = (s: string) => ACCENTS[[...(s || "?")].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length];
const initials = (s: string) => (s || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function SuppliersPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  React.useEffect(() => { fetch("/api/erp/suppliers").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const rows = all.filter((r) => ((r.name || "") + (r.email || "") + (r.phone || "")).toLowerCase().includes(q.toLowerCase()));
  const activeCount = all.filter((r) => r.active).length;

  const COLS: Column<Row>[] = [
    { key: "name", header: "Supplier", render: (r) => { const a = accentFor(r.name); return <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in srgb, ${a} 14%, ${color.surface.card})`, color: a, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.name)}</span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name || "—"}</span></span>; } },
    { key: "email", header: "Email", render: (r) => <span style={{ color: color.ink.mid }}>{r.email || "—"}</span> },
    { key: "phone", header: "Phone", width: 160, render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.phone || "—"}</span> },
    { key: "currency", header: "Currency", width: 100, render: (r) => <span style={{ color: color.ink.mid }}>{r.currency || "AED"}</span> },
    { key: "active", header: "Status", width: 110, render: (r) => <StatusBadge tone={r.active ? "positive" : "neutral"} label={r.active ? "active" : "inactive"} /> },
  ];

  return (
    <AppShell active="suppliers">
      <PageTitleRow title="Suppliers" subtitle={`${all.length} vendors`} actions={<NewCrmButton entity="supplier" label="+ New supplier" />} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Suppliers" value={String(all.length)} note="vendors" noteTone={color.brand.primary} />
        <KPICard label="Active" value={String(activeCount)} note="enabled" noteTone={color.status.positive} />
        <KPICard label="Inactive" value={String(all.length - activeCount)} note="disabled" noteTone={color.ink.soft} />
        <KPICard label="With email" value={String(all.filter((r) => r.email).length)} note="reachable" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search supplier, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No suppliers" hint="Vendors for your workspace appear here." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/suppliers/${r.id}`} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Suppliers · live via API · tenant-scoped</p>
    </AppShell>
  );
}
