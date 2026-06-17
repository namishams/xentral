"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StagePill, EmptyState, type Column } from "@xentral/ui";
import { listDeals, type DealRow } from "@xentral/module-crm";

const ALL = listDeals();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Avatar({ name }: { name: string }) {
  return (
    <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

const COLUMNS: Column<DealRow>[] = [
  { key: "name", header: "Deal", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "owner", header: "Owner", width: 80, render: (r) => <Avatar name={r.owner} /> },
  { key: "account", header: "Contact", render: (r) => <span style={{ color: color.ink.mid }}>{r.account}</span> },
  { key: "stage", header: "Stage", width: 140, render: (r) => <StagePill stage={r.stage} /> },
  { key: "value", header: "Value", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.value)}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: string) => boolean }[] = [
  { id: "active", title: "Active deals", accent: color.status.info, match: (s) => s === "new" || s === "qualified" || s === "proposal" || s === "negotiation" },
  { id: "won", title: "Won", accent: color.status.positive, match: (s) => s === "won" },
  { id: "lost", title: "Lost", accent: color.status.negative, match: (s) => s === "lost" },
];

const TABS: [string, string][] = [["main", "Main view"], ["kanban", "Kanban"], ["forecast", "Forecast"]];

export default function DealsPage() {
  const [q, setQ] = React.useState("");
  const [view, setView] = React.useState("main");
  const rows = ALL.filter((r) => (r.name + r.account + r.owner).toLowerCase().includes(q.toLowerCase()));
  const open = ALL.filter((r) => r.stage !== "won" && r.stage !== "lost").reduce((s, r) => s + r.value, 0);
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.stage)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="deals">
      <PageTitleRow title="Deals" subtitle={`${ALL.length} deals · ${aed(open)} open pipeline`} actions={<Button variant="primary">+ New deal</Button>} />

      <div style={{ display: "flex", gap: 20, borderBottom: `1px solid ${color.line.DEFAULT}`, marginBottom: 16 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: view === id ? 600 : 500, color: view === id ? color.brand.primary : color.ink.mid, padding: "8px 0", borderBottom: view === id ? `2px solid ${color.brand.primary}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <FilterBar>
        <Input placeholder="Search deals…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Stage</Button>
        <Button>Owner</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No deals match your search" hint="Try a different name, contact or owner." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/deals/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Grouped pipeline (monday-style) · locked DataTable + StagePill · pastel stage tokens from @xentral/config</p>
    </AppShell>
  );
}
