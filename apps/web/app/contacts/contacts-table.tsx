"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import type { ContactRow } from "@xentral/module-crm";

const COLUMNS: Column<ContactRow>[] = [
  { key: "name", header: "Name", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "title", header: "Title", render: (r) => <span style={{ color: color.ink.mid }}>{r.title}</span> },
  { key: "company", header: "Company", render: (r) => r.company },
  { key: "email", header: "Email", render: (r) => <span style={{ color: color.ink.mid }}>{r.email}</span> },
  { key: "phone", header: "Phone", width: 160, render: (r) => <span style={{ color: color.ink.mid }}>{r.phone}</span> },
  { key: "owner", header: "Owner", width: 100, render: (r) => (r.owner ? <StatusBadge tone="info" label={r.owner} /> : null) },
];

export function ContactsTable({ rows: all }: { rows: ContactRow[] }) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = all.filter((r) => (r.name + r.company + r.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search name, company, email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No contacts" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
