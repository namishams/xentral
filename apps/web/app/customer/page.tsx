"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, DataTable, StatusBadge, DashboardCard, Button, type Column, type BadgeTone } from "@xentral/ui";
import { outstanding } from "@xentral/kernel";
import { listInvoices, type InvoiceRow, type InvoiceStatus } from "@xentral/module-books";
import { listDeals, type DealRow, type DealStage } from "@xentral/module-crm";

const CUSTOMER = "Al Noor Real Estate";
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const bal = (r: InvoiceRow) => outstanding({ total: r.total, amountPaid: r.amountPaid, currency: r.currency, status: "PARTIALLY_PAID" });

const INV_TONE: Record<InvoiceStatus, BadgeTone> = { DRAFT: "neutral", SENT: "info", PARTIALLY_PAID: "warning", PAID: "positive", CANCELLED: "neutral" };
const DEAL_TONE: Record<DealStage, BadgeTone> = { new: "neutral", qualified: "info", proposal: "warning", won: "positive", lost: "critical" };

// Cross-module: pull this customer's data from two module contracts.
const invoices = listInvoices().filter((r) => r.customer === CUSTOMER);
const deals = listDeals().filter((r) => r.account === CUSTOMER);
const totalDue = invoices.reduce((s, r) => s + bal(r), 0);

const INV_COLS: Column<InvoiceRow>[] = [
  { key: "number", header: "Number", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "status", header: "Status", render: (r) => <StatusBadge tone={INV_TONE[r.status]} label={r.status.replace("_", " ").toLowerCase()} /> },
  { key: "total", header: "Total", width: 110, align: "right", render: (r) => aed(r.total) },
  { key: "balance", header: "Balance", width: 110, align: "right", render: (r) => <span style={{ color: bal(r) > 0 ? color.status.critical : color.ink.soft }}>{aed(bal(r))}</span> },
];
const DEAL_COLS: Column<DealRow>[] = [
  { key: "name", header: "Deal", render: (r) => r.name },
  { key: "stage", header: "Stage", width: 110, render: (r) => <StatusBadge tone={DEAL_TONE[r.stage]} label={r.stage} /> },
  { key: "value", header: "Value", width: 120, align: "right", render: (r) => aed(r.value) },
];

export default function CustomerPage() {
  return (
    <AppShell active="deals">
      <PageTitleRow
        breadcrumb="Customers › Al Noor Real Estate"
        title={CUSTOMER}
        badge={<StatusBadge tone="positive" label="active" />}
        actions={<><Button>New deal</Button><Button variant="primary">New invoice</Button></>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 8 }}>Invoices</div>
            <DataTable columns={INV_COLS} rows={invoices} getKey={(r) => r.id} rowHref={() => "/invoice"} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 8 }}>Deals</div>
            <DataTable columns={DEAL_COLS} rows={deals} getKey={(r) => r.id} rowHref={() => "/deals"} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DashboardCard size="medium" title="Total outstanding" className="!h-auto">
            <div style={{ fontSize: 22, fontWeight: 700, color: totalDue > 0 ? color.status.critical : color.status.positive }}>{aed(totalDue)}</div>
            <div style={{ fontSize: 12, color: color.ink.mid }}>{invoices.length} invoices · {deals.length} deals</div>
          </DashboardCard>
          <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 8 }}>Details</div>
            <div style={{ fontSize: 12, color: color.ink.mid, lineHeight: 1.8 }}>Business Bay, Dubai<br />finance@alnoor.ae<br />+971 4 555 0142<br />TRN 100xxxxxxxxxxxx</div>
          </div>
          <div style={{ fontSize: 11, color: color.ink.soft, textAlign: "center" }}>Composed from @xentral/module-books + @xentral/module-crm + @xentral/kernel</div>
        </div>
      </div>
    </AppShell>
  );
}
