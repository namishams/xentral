"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listQuotes, type QuoteRow, type QuoteStatus } from "@xentral/module-books";

const ALL = listQuotes();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const TONE: Record<QuoteStatus, BadgeTone> = { draft: "neutral", sent: "info", accepted: "positive", rejected: "critical", expired: "neutral" };

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<QuoteRow>[] = [
  { key: "number", header: "Quote", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.customer} /><span style={{ color: color.ink.DEFAULT }}>{r.customer}</span></span> },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
  { key: "valid", header: "Valid until", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.validUntil}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: QuoteStatus) => boolean }[] = [
  { id: "open", title: "Open", accent: color.status.info, match: (s) => s === "draft" || s === "sent" },
  { id: "accepted", title: "Accepted", accent: color.status.positive, match: (s) => s === "accepted" },
  { id: "closed", title: "Rejected / expired", accent: color.ink.soft, match: (s) => s === "rejected" || s === "expired" },
];

export default function QuotationsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.number + r.customer).toLowerCase().includes(q.toLowerCase()));
  const openValue = ALL.filter((r) => r.status === "draft" || r.status === "sent").reduce((s, r) => s + r.total, 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="quotations">
      <PageTitleRow title="Quotes" subtitle={`${ALL.length} quotes · ${aed(openValue)} open`} actions={<Button variant="primary">+ New quote</Button>} />
      <FilterBar>
        <Input placeholder="Search quote or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button>Status</Button>
        <Button>Customer</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No quotes match your search" hint="Try a different number or customer." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/quotations/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Grouped by status · @xentral/module-books · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
