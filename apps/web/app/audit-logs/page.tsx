"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";

type Row = { id: string; action: string; targetType: string; targetId: string; meta: string | null; when: string; actor: string };

const initials = (s: string) => (s || "?").split(/[\s@.]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
function toneFor(action: string): "neutral" | "info" | "positive" | "warning" | "critical" {
  if (/(delete|remove|reject|suspend|cancel)/.test(action)) return "critical";
  if (/(create|add|approve|accept)/.test(action)) return "positive";
  if (/(update|edit|change|patch)/.test(action)) return "info";
  return "neutral";
}

export default function AuditLogsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => { setRows(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => (`${r.actor} ${r.action} ${r.targetType} ${r.targetId} ${r.meta || ""}`).toLowerCase().includes(q.toLowerCase()));
  const actors = new Set(rows.map((r) => r.actor)).size;

  const COLS: Column<Row>[] = [
    { key: "when", header: "When", width: 160, render: (r) => <span style={{ color: color.ink.mid, fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{r.when}</span> },
    { key: "actor", header: "Actor", width: 190, render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 24, height: 24, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.actor)}</span><span style={{ color: color.ink.DEFAULT, fontSize: 13 }}>{r.actor}</span></span> },
    { key: "action", header: "Action", width: 200, render: (r) => <StatusBadge tone={toneFor(r.action)} label={r.action} /> },
    { key: "targetType", header: "Target", render: (r) => <span style={{ color: color.ink.mid }}>{r.targetType ? `${r.targetType}${r.targetId ? ` · ${r.targetId.slice(0, 12)}` : ""}` : "—"}</span> },
  ];

  return (
    <AppShell active="audit-logs">
      <PageTitleRow title="Audit Logs" subtitle={`${rows.length} events · immutable trail`} actions={<button onClick={load} style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↻ Refresh</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Events" value={String(rows.length)} note="recorded" noteTone={color.brand.primary} />
        <KPICard label="Actors" value={String(actors)} note="distinct users" noteTone={color.status.info} />
        <KPICard label="Scope" value="Workspace" note="tenant-isolated" noteTone={color.ink.soft} />
        <KPICard label="Retention" value="∞" note="tamper-evident" noteTone={color.status.positive} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <Input placeholder="Search actor, action, target…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 320 }} />
        <span style={{ fontSize: 12, color: color.ink.soft }}>Newest first · workspace-scoped</span>
      </div>

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : filtered.length === 0 ? <EmptyState title={rows.length === 0 ? "No events yet" : "No matches"} hint={rows.length === 0 ? "Actions across the workspace — creating customers, items, sending invoices, changing settings — are recorded here for compliance." : "Try a different search."} />
          : <DataTable columns={COLS} rows={filtered} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Audit trail · tenant-scoped · immutable</p>
    </AppShell>
  );
}
