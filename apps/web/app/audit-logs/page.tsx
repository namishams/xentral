"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listAuditEvents, type AuditEvent } from "@xentral/module-platform";

const ALL = listAuditEvents();

const COLUMNS: Column<AuditEvent>[] = [
  { key: "when", header: "When", width: 150, render: (r) => <span style={{ color: color.ink.mid, fontSize: 12.5 }}>{r.when}</span> },
  { key: "actor", header: "Actor", width: 130, render: (r) => <StatusBadge tone={r.actor === "system" ? "neutral" : "info"} label={r.actor} /> },
  { key: "action", header: "Action", width: 170, render: (r) => <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12.5, color: color.ink.DEFAULT }}>{r.action}</span> },
  { key: "target", header: "Target", render: (r) => <span style={{ color: color.ink.mid }}>{r.target}</span> },
];

export default function AuditLogsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.actor + r.action + r.target).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="audit-logs">
      <PageTitleRow title="Audit Logs" subtitle={`${ALL.length} events · immutable trail`} />
      <FilterBar>
        <Input placeholder="Search actor, action, target…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <span style={{ fontSize: 12, color: color.ink.soft, alignSelf: "center" }}>Tamper-evident · newest first</span>
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No matching events" hint="Try a different actor or action." />
      ) : (
        <div style={{ marginTop: 8 }}>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Audit trail · @xentral/module-platform · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
