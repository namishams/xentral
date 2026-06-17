"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listPurchases, type PurchaseRow, type PurchaseStatus } from "@xentral/module-erp";

const ALL = listPurchases();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const TONE: Record<PurchaseStatus, BadgeTone> = { draft: "neutral", sent: "info", received: "positive", cancelled: "neutral" };

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<PurchaseRow>[] = [
  { key: "number", header: "PO", width: 100, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "supplier", header: "Supplier", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.supplier} /><span style={{ color: color.ink.DEFAULT }}>{r.supplier}</span></span> },
  { key: "items", header: "Items", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.items}</span> },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
  { key: "date", header: "Date", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.date}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: PurchaseStatus) => boolean }[] = [
  { id: "open", title: "Open", accent: color.status.info, match: (s) => s === "draft" || s === "sent" },
  { id: "received", title: "Received", accent: color.status.positive, match: (s) => s === "received" },
  { id: "cancelled", title: "Cancelled", accent: color.ink.soft, match: (s) => s === "cancelled" },
];

export default function ProcurementPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.number + r.supplier).toLowerCase().includes(q.toLowerCase()));
  const openValue = ALL.filter((r) => r.status === "draft" || r.status === "sent").reduce((s, r) => s + r.total, 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="procurement">
      <PageTitleRow title="Procurement" subtitle={`${ALL.length} purchase orders · ${aed(openValue)} open`} actions={<Button variant="primary">+ New PO</Button>} />
      <FilterBar>
        <Input placeholder="Search PO or supplier…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button>Status</Button>
        <Button>Supplier</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No purchase orders match your search" hint="Try a different number or supplier." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
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

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Purchase orders · @xentral/module-erp · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
