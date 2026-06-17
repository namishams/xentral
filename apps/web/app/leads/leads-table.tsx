"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StagePill, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import type { LeadRow } from "@xentral/module-crm";

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Avatar({ name }: { name: string }) {
  return (
    <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">{initials(name)}</span>
  );
}
function scoreTone(score: number): BadgeTone {
  if (score >= 75) return "positive";
  if (score >= 50) return "warning";
  return "neutral";
}

const COLUMNS: Column<LeadRow>[] = [
  { key: "name", header: "Lead", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "owner", header: "Owner", width: 80, render: (r) => <Avatar name={r.owner} /> },
  { key: "company", header: "Company", render: (r) => <span style={{ color: color.ink.mid }}>{r.company}</span> },
  { key: "source", header: "Source", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.source}</span> },
  { key: "score", header: "Score", width: 80, render: (r) => <StatusBadge tone={scoreTone(r.score)} label={String(r.score)} /> },
  { key: "stage", header: "Stage", width: 140, render: (r) => <StagePill stage={r.stage} /> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: string) => boolean }[] = [
  { id: "new", title: "New leads", accent: color.status.info, match: (s) => s === "new" },
  { id: "working", title: "Working", accent: color.status.critical, match: (s) => s === "working" },
  { id: "qualified", title: "Qualified", accent: color.status.positive, match: (s) => s === "qualified" },
  { id: "unqualified", title: "Unqualified", accent: color.ink.soft, match: (s) => s === "unqualified" },
];

export function LeadsTable({ rows: all }: { rows: LeadRow[] }) {
  const [q, setQ] = React.useState("");
  const rows = all.filter((r) => (r.name + r.company + r.source).toLowerCase().includes(q.toLowerCase()));
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.stage)) })).filter((x) => x.gr.length > 0);

  return (
    <>
      <FilterBar>
        <Input placeholder="Search lead, company, source…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <Button>Source</Button>
        <Button>Owner</Button>
      </FilterBar>
      {visibleGroups.length === 0 ? (
        <EmptyState title="No leads" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/leads/${r.id}`} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
