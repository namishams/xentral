"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import type { ContactRow } from "@xentral/module-crm";

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Avatar({ name }: { name: string }) {
  return (
    <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>
  );
}

const COLUMNS: Column<ContactRow>[] = [
  { key: "name", header: "Name", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} /><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span></span> },
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
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/contacts/${r.id}`} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
