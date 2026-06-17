"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listBills, type BillRow, type BillStatus } from "@xentral/module-erp";

const ALL = listBills();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const TONE: Record<BillStatus, BadgeTone> = { open: "info", approved: "warning", overdue: "critical", paid: "positive" };

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<BillRow>[] = [
  { key: "number", header: "Bill", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "supplier", header: "Supplier", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.supplier} /><span style={{ color: color.ink.DEFAULT }}>{r.supplier}</span></span> },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "amount", header: "Amount", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.amount)}</span> },
  { key: "due", header: "Due", width: 80, align: "right", render: (r) => <span style={{ color: r.status === "overdue" ? color.status.critical : color.ink.mid }}>{r.dueDate}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: BillStatus) => boolean }[] = [
  { id: "overdue", title: "Overdue", accent: color.status.critical, match: (s) => s === "overdue" },
  { id: "due", title: "Due", accent: color.status.info, match: (s) => s === "open" || s === "approved" },
  { id: "paid", title: "Paid", accent: color.status.positive, match: (s) => s === "paid" },
];

export default function PayablesPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.number + r.supplier).toLowerCase().includes(q.toLowerCase()));
  const due = ALL.filter((r) => r.status !== "paid").reduce((s, r) => s + r.amount, 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="payables">
      <PageTitleRow title="Payables" subtitle={`${ALL.length} bills · ${aed(due)} to pay`} actions={<Button variant="primary">+ New bill</Button>} />
      <FilterBar>
        <Input placeholder="Search bill or supplier…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button>Status</Button>
        <Button>Supplier</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No bills match your search" hint="Try a different number or supplier." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/payables/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Accounts payable · @xentral/module-erp · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
