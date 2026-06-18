"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, DataTable, type Column } from "@xentral/ui";

type Row = { id: string; name: string; email: string | null; invoiceCount: number; outstanding: number; currency: string };
const aed = (n: number, c = "AED") => `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomersListPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/books/customers?stats=1").then((r) => r.json()).then((d) => { setRows(d.rows || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const totalOutstanding = rows.reduce((s, r) => s + (Number(r.outstanding) || 0), 0);
  const cur = rows[0]?.currency || "AED";

  const columns: Column<Row>[] = [
    { key: "name", header: "Customer", render: (r) => (<span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span>{r.email ? <span style={{ display: "block", fontSize: 11.5, color: color.ink.soft }}>{r.email}</span> : null}</span>), sort: (r) => r.name.toLowerCase(), filterText: (r) => `${r.name} ${r.email || ""}` },
    { key: "invoices", header: "Invoices", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.invoiceCount}</span>, sort: (r) => r.invoiceCount },
    { key: "outstanding", header: "Outstanding", width: 150, align: "right", render: (r) => <span style={{ fontWeight: 600, color: r.outstanding > 0 ? color.status.negative : color.ink.mid }}>{r.outstanding > 0 ? aed(r.outstanding, r.currency) : "—"}</span>, sort: (r) => r.outstanding },
  ];

  return (
    <AppShell active="customers">
      <PageTitleRow title="Customers" subtitle={`${rows.length} billing customer${rows.length === 1 ? "" : "s"}${totalOutstanding > 0 ? ` · ${aed(totalOutstanding, cur)} outstanding` : ""}`}
        actions={<Button variant="primary" onClick={() => { window.location.href = "/invoices/new"; }}>New invoice</Button>} />
      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : <DataTable<Row> columns={columns} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/customers/${r.id}`} searchable title="All customers" maxHeight={620} searchPlaceholder="Search customers…" initialSort={{ key: "outstanding", dir: "desc" }} />}
    </AppShell>
  );
}
