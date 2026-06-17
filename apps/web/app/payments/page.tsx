"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { RecordPaymentButton } from "../../components/record-payment";

type Row = { id: string; ref: string | null; amount: number; method: string | null; date: string | null; customer: string | null; invoiceNo: string | null };
const aed = (n: number) => `AED ${Math.round(n || 0).toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`;
const initials = (s: string) => (s || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function PaymentsPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  React.useEffect(() => { fetch("/api/books/payments").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const rows = all.filter((r) => ((r.ref || "") + (r.customer || "") + (r.method || "") + (r.invoiceNo || "")).toLowerCase().includes(q.toLowerCase()));
  const received = all.reduce((s, r) => s + (r.amount || 0), 0);
  const methods = new Set(all.map((r) => r.method).filter(Boolean)).size;

  const COLS: Column<Row>[] = [
    { key: "ref", header: "Reference", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.ref || r.invoiceNo || "—"}</span> },
    { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.customer || "?")}</span><span style={{ color: color.ink.DEFAULT }}>{r.customer || "—"}</span></span> },
    { key: "invoice", header: "Invoice", width: 120, render: (r) => <span style={{ color: color.ink.mid }}>{r.invoiceNo || "—"}</span> },
    { key: "method", header: "Method", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.method || "—"}</span> },
    { key: "status", header: "Status", width: 110, render: () => <StatusBadge tone="positive" label="received" /> },
    { key: "amount", header: "Amount", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.amount)}</span> },
    { key: "date", header: "Date", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.date || "—"}</span> },
  ];

  return (
    <AppShell active="payments">
      <PageTitleRow title="Payments" subtitle={`${all.length} payments · ${aed(received)} received`} actions={<RecordPaymentButton />} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Payments" value={String(all.length)} note="recorded" noteTone={color.brand.primary} />
        <KPICard label="Received" value={aedShort(received)} note="settled in" noteTone={color.status.positive} />
        <KPICard label="Avg payment" value={aedShort(all.length ? received / all.length : 0)} note="per transaction" noteTone={color.ink.soft} />
        <KPICard label="Methods" value={String(methods)} note="channels" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search reference, customer, method…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 320 }} />
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No payments" hint="Recorded payments appear here." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Payments · live via API (payment records) · tenant-scoped</p>
    </AppShell>
  );
}
