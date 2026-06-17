"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Ticket = { id: string; subject: string; customer: string; priority: "low" | "medium" | "high"; status: "open" | "pending" | "resolved"; age: string };
const ALL: Ticket[] = [
  { id: "t1", subject: "Invoice PDF not downloading", customer: "Gulf Trading", priority: "high", status: "open", age: "1h" },
  { id: "t2", subject: "Request: add user seat", customer: "Damac Properties", priority: "medium", status: "pending", age: "4h" },
  { id: "t3", subject: "WhatsApp number change", customer: "Al Noor", priority: "low", status: "open", age: "1d" },
  { id: "t4", subject: "VAT figure question", customer: "Skyline", priority: "medium", status: "resolved", age: "2d" },
];
const P_TONE: Record<Ticket["priority"], BadgeTone> = { high: "critical", medium: "warning", low: "neutral" };
const S_TONE: Record<Ticket["status"], BadgeTone> = { open: "info", pending: "warning", resolved: "positive" };

const groups = [
  { id: "open", title: "Open", accent: color.status.info },
  { id: "pending", title: "Pending", accent: color.status.critical },
  { id: "resolved", title: "Resolved", accent: color.status.positive },
];

export default function ServiceDeskPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((t) => (t.subject + t.customer).toLowerCase().includes(q.toLowerCase()));
  const COLS: Column<Ticket>[] = [
    { key: "subject", header: "Ticket", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.subject}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.customer}</span></span> },
    { key: "priority", header: "Priority", width: 110, render: (r) => <StatusBadge tone={P_TONE[r.priority]} label={r.priority} /> },
    { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={S_TONE[r.status]} label={r.status} /> },
    { key: "age", header: "Age", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.age}</span> },
  ];
  const visible = groups.map((g) => ({ g, gr: rows.filter((r) => r.status === g.id) })).filter((x) => x.gr.length > 0);
  return (
    <AppShell active="service-desk">
      <PageTitleRow title="Service Desk" subtitle="Customer support tickets and SLAs" actions={<Button variant="primary">+ New ticket</Button>} />
      <FilterBar><Input placeholder="Search tickets…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} /></FilterBar>
      {visible.length === 0 ? <EmptyState title="No tickets match" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear</Button>} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visible.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLS} rows={gr} getKey={(r) => r.id} />
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Service desk · tokens-only, theme-aware</p>
    </AppShell>
  );
}
