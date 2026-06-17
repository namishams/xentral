"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listPayments, type PaymentRow, type PaymentStatus } from "@xentral/module-books";

const ALL = listPayments();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const TONE: Record<PaymentStatus, BadgeTone> = { received: "positive", pending: "warning", failed: "critical" };

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<PaymentRow>[] = [
  { key: "ref", header: "Reference", width: 120, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.ref}</span> },
  { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.customer} /><span style={{ color: color.ink.DEFAULT }}>{r.customer}</span></span> },
  { key: "method", header: "Method", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.method}</span> },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "amount", header: "Amount", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.amount)}</span> },
  { key: "date", header: "Date", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.date}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: PaymentStatus) => boolean }[] = [
  { id: "pending", title: "Pending", accent: color.status.critical, match: (s) => s === "pending" || s === "failed" },
  { id: "received", title: "Received", accent: color.status.positive, match: (s) => s === "received" },
];

export default function PaymentsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.ref + r.customer + r.method).toLowerCase().includes(q.toLowerCase()));
  const received = ALL.filter((r) => r.status === "received").reduce((s, r) => s + r.amount, 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="payments">
      <PageTitleRow title="Payments" subtitle={`${ALL.length} payments · ${aed(received)} received`} actions={<Button variant="primary">+ Record payment</Button>} />
      <FilterBar>
        <Input placeholder="Search reference, customer, method…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <Button>Status</Button>
        <Button>Method</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No payments match your search" hint="Try a different reference or customer." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Grouped by status · @xentral/module-books · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
