"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, PageTitleRow, DataTable, StatusBadge, Pagination, type Column, type BadgeTone } from "@xentral/ui";
import { outstanding } from "@xentral/kernel";
import { listInvoices, type InvoiceRow, type InvoiceStatus } from "@xentral/module-books";

const ROWS = listInvoices();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const bal = (r: InvoiceRow) => outstanding({ total: r.total, amountPaid: r.amountPaid, currency: r.currency, status: "PARTIALLY_PAID" });
const TONE: Record<InvoiceStatus, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral" };

const COLUMNS: Column<InvoiceRow>[] = [
  { key: "number", header: "Number", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "customer", header: "Customer", render: (r) => r.customer },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status.replace("_", " ").toLowerCase()} /> },
  { key: "total", header: "Total", width: 110, align: "right", render: (r) => aed(r.total) },
  { key: "balance", header: "Balance", width: 110, align: "right", render: (r) => <span style={{ color: bal(r) > 0 ? color.status.critical : color.ink.soft }}>{aed(bal(r))}</span> },
  { key: "due", header: "Due", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.dueDate}</span> },
];

export default function InvoicesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const totalOutstanding = ROWS.reduce((s, r) => s + bal(r), 0);

  return (
    <AppShell active="invoice">
      <PageTitleRow
        title="Invoices"
        subtitle={`${ROWS.length} invoices · ${aed(totalOutstanding)} outstanding`}
        actions={<button style={{ height: 32, padding: "0 14px", borderRadius: 8, background: color.brand.primary, color: "#fff", border: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New invoice</button>}
      />
      <DataTable columns={COLUMNS} rows={ROWS} getKey={(r) => r.id} rowHref={() => "/invoice"} />
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(ROWS.length / pageSize))} pageSize={pageSize} total={ROWS.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Rows from @xentral/module-books · balances via @xentral/kernel · locked DataTable + StatusBadge + Pagination</p>
    </AppShell>
  );
}
