"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { outstanding } from "@xentral/kernel";
import { listInvoices, type InvoiceRow, type InvoiceStatus } from "@xentral/module-books";

const ROWS = listInvoices();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const bal = (r: InvoiceRow) => outstanding({ total: r.total, amountPaid: r.amountPaid, currency: r.currency, status: "PARTIALLY_PAID" });
const TONE: Record<InvoiceStatus, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral" };
const label = (s: InvoiceStatus) => s.replace("_", " ").toLowerCase();

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<InvoiceRow>[] = [
  { key: "number", header: "Number", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.customer} /><span style={{ color: color.ink.DEFAULT }}>{r.customer}</span></span> },
  { key: "status", header: "Status", width: 130, render: (r) => <StatusBadge tone={TONE[r.status]} label={label(r.status)} /> },
  { key: "total", header: "Total", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
  { key: "balance", header: "Balance", width: 110, align: "right", render: (r) => <span style={{ color: bal(r) > 0 ? color.status.critical : color.ink.soft }}>{aed(bal(r))}</span> },
  { key: "due", header: "Due", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.dueDate}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: InvoiceStatus) => boolean }[] = [
  { id: "draft", title: "Drafts", accent: color.ink.soft, match: (s) => s === "DRAFT" },
  { id: "outstanding", title: "Outstanding", accent: color.status.critical, match: (s) => s === "SENT" || s === "PARTIALLY_PAID" },
  { id: "paid", title: "Paid", accent: color.status.positive, match: (s) => s === "PAID" },
  { id: "cancelled", title: "Cancelled", accent: color.ink.soft, match: (s) => s === "CANCELLED" },
];

export default function InvoicesPage() {
  const [q, setQ] = React.useState("");
  const rows = ROWS.filter((r) => (r.number + r.customer).toLowerCase().includes(q.toLowerCase()));
  const totalOutstanding = ROWS.reduce((s, r) => s + bal(r), 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="invoice">
      <PageTitleRow
        title="Invoices"
        subtitle={`${ROWS.length} invoices · ${aed(totalOutstanding)} outstanding`}
        actions={<Button variant="primary">+ New invoice</Button>}
      />
      <FilterBar>
        <Input placeholder="Search number or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button>Status</Button>
        <Button>Customer</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No invoices match your search" hint="Try a different number or customer." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={() => "/invoice"} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Grouped by status · balances via @xentral/kernel · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
