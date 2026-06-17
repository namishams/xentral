"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { outstanding } from "@xentral/kernel";
import { listInvoices, type InvoiceRow, type InvoiceStatus } from "@xentral/module-books";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const bal = (r: InvoiceRow) => outstanding({ total: r.total, amountPaid: r.amountPaid, currency: r.currency, status: "PARTIALLY_PAID" });
const TONE: Record<InvoiceStatus, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral" };
const label = (s: InvoiceStatus) => s.replace("_", " ").toLowerCase();
// Receivables = money owed to us → invoices with an open balance.
const ALL = listInvoices().filter((r) => bal(r) > 0);

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<InvoiceRow>[] = [
  { key: "number", header: "Invoice", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.customer} /><span style={{ color: color.ink.DEFAULT }}>{r.customer}</span></span> },
  { key: "status", header: "Status", width: 130, render: (r) => <StatusBadge tone={TONE[r.status]} label={label(r.status)} /> },
  { key: "balance", header: "Balance", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.status.critical }}>{aed(bal(r))}</span> },
  { key: "due", header: "Due", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.dueDate}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: InvoiceStatus) => boolean }[] = [
  { id: "sent", title: "Awaiting payment", accent: color.status.info, match: (s) => s === "SENT" },
  { id: "partial", title: "Partially paid", accent: color.status.critical, match: (s) => s === "PARTIALLY_PAID" },
];

export default function ReceivablesPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.number + r.customer).toLowerCase().includes(q.toLowerCase()));
  const totalDue = ALL.reduce((s, r) => s + bal(r), 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="receivables">
      <PageTitleRow title="Receivables" subtitle={`${ALL.length} open · ${aed(totalDue)} owed to you`} actions={<Button variant="primary">Send reminders</Button>} />
      <FilterBar>
        <Input placeholder="Search invoice or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button>Status</Button>
        <Button>Customer</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="Nothing outstanding" hint="All invoices are paid — nice." />
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

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Open balances via @xentral/kernel · sourced from @xentral/module-books</p>
    </AppShell>
  );
}
