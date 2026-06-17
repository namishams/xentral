"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listRoles, type RoleRow } from "@xentral/module-platform";

const ALL = listRoles();

const COLUMNS: Column<RoleRow>[] = [
  { key: "name", header: "Role", width: 160, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "scope", header: "Scope", render: (r) => <span style={{ color: color.ink.mid }}>{r.scope}</span> },
  { key: "members", header: "Members", width: 110, render: (r) => <StatusBadge tone="info" label={String(r.members)} /> },
  { key: "permissions", header: "Permissions", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.permissions}</span> },
];

export default function RolesPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.name + r.scope).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="roles">
      <PageTitleRow title="Roles" subtitle={`${ALL.length} roles`} actions={<Button variant="primary">+ New role</Button>} />
      <FilterBar>
        <Input placeholder="Search roles…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No roles" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/roles/${r.id}`} />
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Role-based access · @xentral/module-platform · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
