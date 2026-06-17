"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listBills, type BillRow, type BillStatus } from "@xentral/module-erp";

const ALL = listBills();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${n}`;
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
  { key: "due", header: "Due", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.dueDate}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: BillStatus) => boolean }[] = [
  { id: "overdue", title: "Overdue", accent: color.status.negative, match: (s) => s === "overdue" },
  { id: "payable", title: "To pay", accent: color.status.critical, match: (s) => s === "open" || s === "approved" },
  { id: "paid", title: "Paid", accent: color.status.positive, match: (s) => s === "paid" },
];

const FILTERS: { id: string; label: string; match: (s: BillStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "overdue", label: "Overdue", match: (s) => s === "overdue" },
  { id: "payable", label: "To pay", match: (s) => s === "open" || s === "approved" },
  { id: "paid", label: "Paid", match: (s) => s === "paid" },
];

export default function PayablesPage() {
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");
  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = ALL.filter((r) => active.match(r.status)).filter((r) => (r.number + r.supplier).toLowerCase().includes(q.toLowerCase()));
  const payable = ALL.filter((r) => r.status !== "paid").reduce((s, r) => s + r.amount, 0);
  const overdue = ALL.filter((r) => r.status === "overdue").reduce((s, r) => s + r.amount, 0);
  const paid = ALL.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const avg = ALL.length ? Math.round(ALL.reduce((s, r) => s + r.amount, 0) / ALL.length) : 0;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="payables">
      <PageTitleRow title="Payables" subtitle={`${ALL.length} bills · ${aed(payable)} to pay`} actions={<Button variant="primary">+ New bill</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Bills" value={String(ALL.length)} note="recorded" noteTone={color.brand.primary} />
        <KPICard label="To pay" value={aedShort(payable)} note="open + approved" noteTone={color.status.critical} />
        <KPICard label="Overdue" value={aedShort(overdue)} note="past due" noteTone={color.status.negative} />
        <KPICard label="Paid" value={aedShort(paid)} note="settled" noteTone={color.status.positive} />
        <KPICard label="Avg bill" value={aedShort(avg)} note="per document" noteTone={color.ink.soft} />
        <KPICard label="Suppliers" value={String(new Set(ALL.map((r) => r.supplier)).size)} note="billed" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search bill or supplier…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = filt === f.id;
          return (
            <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {f.label}{f.id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ALL.filter((r) => f.match(r.status)).length}</span> : null}
            </button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No bills match your filters" hint="Try a different bill, supplier or status." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 4 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
                <span style={{ fontSize: 12, color: color.ink.soft, marginLeft: "auto" }}>{aed(gr.reduce((s, r) => s + r.amount, 0))}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/payables/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · grouped by status · locked DataTable + StatusBadge · tokens-only</p>
    </AppShell>
  );
}
