"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { outstanding } from "@xentral/kernel";
import { listInvoices, type InvoiceRow, type InvoiceStatus } from "@xentral/module-books";

const ROWS = listInvoices();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${n}`;
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

const FILTERS: { id: string; label: string; match: (s: InvoiceStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "draft", label: "Drafts", match: (s) => s === "DRAFT" },
  { id: "outstanding", label: "Outstanding", match: (s) => s === "SENT" || s === "PARTIALLY_PAID" },
  { id: "paid", label: "Paid", match: (s) => s === "PAID" },
];

export default function InvoicesPage() {
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");
  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = ROWS.filter((r) => active.match(r.status)).filter((r) => (r.number + r.customer).toLowerCase().includes(q.toLowerCase()));
  const totalOutstanding = ROWS.reduce((s, r) => s + bal(r), 0);
  const paid = ROWS.reduce((s, r) => s + r.amountPaid, 0);
  const drafts = ROWS.filter((r) => r.status === "DRAFT").length;
  const overdueCount = ROWS.filter((r) => bal(r) > 0).length;
  const avg = ROWS.length ? Math.round(ROWS.reduce((s, r) => s + r.total, 0) / ROWS.length) : 0;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="invoice">
      <PageTitleRow title="Invoices" subtitle={`${ROWS.length} invoices · ${aed(totalOutstanding)} outstanding`} actions={<Button variant="primary">+ New invoice</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Invoices" value={String(ROWS.length)} note="issued" noteTone={color.brand.primary} />
        <KPICard label="Outstanding" value={aedShort(totalOutstanding)} note={`${overdueCount} open`} noteTone={color.status.critical} />
        <KPICard label="Collected" value={aedShort(paid)} note="paid in" noteTone={color.status.positive} />
        <KPICard label="Drafts" value={String(drafts)} note="not sent" noteTone={color.ink.soft} />
        <KPICard label="Avg invoice" value={aedShort(avg)} note="per document" noteTone={color.ink.soft} />
        <KPICard label="Customers" value={String(new Set(ROWS.map((r) => r.customer)).size)} note="billed" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search number or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = filt === f.id;
          return (
            <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {f.label}{f.id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ROWS.filter((r) => f.match(r.status)).length}</span> : null}
            </button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No invoices match your filters" hint="Try a different number, customer or status." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 4 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
                <span style={{ fontSize: 12, color: color.ink.soft, marginLeft: "auto" }}>{aed(gr.reduce((s, r) => s + r.total, 0))}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/invoices/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · balances via @xentral/kernel · locked DataTable + StatusBadge · tokens-only</p>
    </AppShell>
  );
}
