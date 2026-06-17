"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import { listContacts, type ContactRow } from "@xentral/module-crm";

const ALL = listContacts();

const COLUMNS: Column<ContactRow>[] = [
  { key: "name", header: "Name", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "title", header: "Title", render: (r) => <span style={{ color: color.ink.mid }}>{r.title}</span> },
  { key: "company", header: "Company", render: (r) => r.company },
  { key: "email", header: "Email", render: (r) => <span style={{ color: color.ink.mid }}>{r.email}</span> },
  { key: "phone", header: "Phone", width: 160, render: (r) => <span style={{ color: color.ink.mid }}>{r.phone}</span> },
  { key: "owner", header: "Owner", width: 100, render: (r) => <StatusBadge tone="info" label={r.owner} /> },
];

export default function ContactsPage() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = ALL.filter((r) => (r.name + r.company + r.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="contacts">
      <PageTitleRow title="Contacts" subtitle={`${ALL.length} people`} actions={<Button variant="primary">+ New contact</Button>} />
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
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Live data via @xentral/module-crm · locked components only</p>
    </AppShell>
  );
}
