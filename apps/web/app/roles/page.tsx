"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listRoles, type RoleRow } from "@xentral/module-platform";

const ALL = listRoles();
const MAX_PERMS = Math.max(...ALL.map((r) => r.permissions), 1);

function PermMeter({ n }: { n: number }) {
  const pct = Math.round((n / MAX_PERMS) * 100);
  const c = pct >= 80 ? color.status.negative : pct >= 50 ? color.status.critical : color.status.positive;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 130 }}>
      <span style={{ position: "relative", flex: 1, height: 6, borderRadius: 3, background: color.surface.sunken, overflow: "hidden" }}>
        <span style={{ position: "absolute", inset: 0, width: `${pct}%`, background: c, borderRadius: 3 }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: color.ink.mid, minWidth: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{n}</span>
    </span>
  );
}

const COLUMNS: Column<RoleRow>[] = [
  { key: "name", header: "Role", width: 170, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "scope", header: "Scope", render: (r) => <span style={{ color: color.ink.mid }}>{r.scope}</span> },
  { key: "members", header: "Members", width: 110, render: (r) => <StatusBadge tone={r.members > 0 ? "info" : "neutral"} label={String(r.members)} /> },
  { key: "permissions", header: "Permissions", width: 180, render: (r) => <PermMeter n={r.permissions} /> },
];

export default function RolesPage() {
  const [q, setQ] = React.useState("");
  const [scope, setScope] = React.useState("all");
  const scopes = React.useMemo(() => Array.from(new Set(ALL.map((r) => r.scope))), []);
  const rows = ALL.filter((r) => scope === "all" || r.scope === scope).filter((r) => (r.name + r.scope).toLowerCase().includes(q.toLowerCase()));
  const members = ALL.reduce((s, r) => s + r.members, 0);
  const avgPerms = ALL.length ? Math.round(ALL.reduce((s, r) => s + r.permissions, 0) / ALL.length) : 0;
  const topRole = ALL.reduce((m, r) => (r.members > m.members ? r : m), ALL[0]!);

  return (
    <AppShell active="roles">
      <PageTitleRow title="Roles" subtitle={`${ALL.length} roles · ${members} members`} actions={<Button variant="primary">+ New role</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Roles" value={String(ALL.length)} note="defined" noteTone={color.brand.primary} />
        <KPICard label="Members" value={String(members)} note="assigned" noteTone={color.status.positive} />
        <KPICard label="Avg permissions" value={String(avgPerms)} note="per role" noteTone={color.ink.soft} />
        <KPICard label="Scopes" value={String(scopes.length)} note="access levels" noteTone={color.ink.soft} />
        <KPICard label="Largest role" value={topRole.name} note={`${topRole.members} members`} noteTone={color.ink.soft} />
        <KPICard label="Read-only" value={String(ALL.filter((r) => r.permissions <= 6).length)} note="view roles" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search roles…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {[["all", "All"] as [string, string], ...scopes.map((s) => [s, s] as [string, string])].map(([id, lab]) => {
          const on = scope === id;
          return (
            <button key={id} onClick={() => setScope(id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ALL.filter((r) => r.scope === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No roles match your filters" hint="Try a different search or scope." action={<Button variant="primary" onClick={() => { setQ(""); setScope("all"); }}>Clear filters</Button>} />
      ) : (
        <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/roles/${r.id}`} />
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · permissions meter · locked DataTable + StatusBadge · tokens-only</p>
    </AppShell>
  );
}
