"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import type { UserRow } from "@xentral/module-platform";

const COLUMNS: Column<UserRow>[] = [
  { key: "name", header: "Name", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "email", header: "Email", render: (r) => <span style={{ color: color.ink.mid }}>{r.email}</span> },
  { key: "role", header: "Role", width: 120, render: (r) => <StatusBadge tone="info" label={r.role} /> },
  { key: "active", header: "Status", width: 110, render: (r) => <StatusBadge tone={r.active ? "positive" : "neutral"} label={r.active ? "active" : "disabled"} /> },
  { key: "lastLogin", header: "Last login", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.lastLogin}</span> },
];

export function UsersTable({ rows: all }: { rows: UserRow[] }) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = all.filter((r) => (r.name + r.email + r.role).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search name, email, role…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No members" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/users/${r.id}`} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
