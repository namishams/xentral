"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";

type Row = { id: string; date: string; memo: string; source: string; status: string; amount: number };
const aed = (n: number) => `AED ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`;

export default function LedgerPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  React.useEffect(() => { fetch("/api/erp/ledger").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const rows = all.filter((r) => ((r.memo || "") + (r.source || "")).toLowerCase().includes(q.toLowerCase()));
  const posted = all.filter((r) => (r.status || "").toLowerCase() === "posted").length;
  const totalDebit = all.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const COLS: Column<Row>[] = [
    { key: "date", header: "Date", width: 130, render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.date || "—"}</span> },
    { key: "memo", header: "Memo", render: (r) => <span style={{ color: color.ink.DEFAULT }}>{r.memo || "—"}</span> },
    { key: "source", header: "Source", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.source || "manual"}</span> },
    { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={(r.status || "").toLowerCase() === "posted" ? "positive" : "neutral"} label={(r.status || "").toLowerCase() || "—"} /> },
    { key: "amount", header: "Amount", width: 140, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(r.amount)}</span> },
  ];

  return (
    <AppShell active="ledger">
      <PageTitleRow title="Ledger" subtitle={`${all.length} journal entries`} actions={<Button variant="primary">+ New entry</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Entries" value={String(all.length)} note="journal entries" noteTone={color.brand.primary} />
        <KPICard label="Posted" value={String(posted)} note="finalised" noteTone={color.status.positive} />
        <KPICard label="Draft" value={String(all.length - posted)} note="unposted" noteTone={color.ink.soft} />
        <KPICard label="Total debits" value={aedShort(totalDebit)} note="booked" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search memo or source…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No journal entries" hint="General-ledger entries appear here as you post invoices, payments and bills." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Ledger · live via API · tenant-scoped</p>
    </AppShell>
  );
}
