"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, ExportMenu, KPICard, Button, DataTable, Panel, PanelHeader, PanelBody, EmptyState, type Column } from "@xentral/ui";

type Row = { id: string; name: string; email: string | null; invoiceCount: number; outstanding: number | string; billed?: number | string; paid?: number | string; currency: string };

const N = (v: unknown) => Number(v) || 0;
const aed = (n: number, c = "AED") => `${c} ${N(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const aedShort = (n: number) => { n = N(n); return n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`; };
const initials = (s: string) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export default function CustomersListPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/books/customers?stats=1").then((r) => r.json()).then((d) => { setRows(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const cur = rows[0]?.currency || "AED";
  const totalOutstanding = rows.reduce((s, r) => s + N(r.outstanding), 0);
  const totalBilled = rows.reduce((s, r) => s + N(r.billed), 0);
  const totalPaid = rows.reduce((s, r) => s + N(r.paid), 0);
  const debtors = rows.filter((r) => N(r.outstanding) > 0).slice(0, 6);

  const COLS: Column<Row>[] = [
    { key: "name", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}><span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 8, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.name)}</span><span style={{ minWidth: 0 }}><span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>{r.email ? <span style={{ display: "block", fontSize: 11.5, color: color.ink.soft }}>{r.email}</span> : null}</span></span>, sort: (r) => (r.name || "").toLowerCase(), filterText: (r) => `${r.name} ${r.email || ""}` },
    { key: "invoiceCount", header: "Invoices", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.invoiceCount}</span>, sort: (r) => r.invoiceCount },
    { key: "billed", header: "Lifetime billed", width: 150, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{N(r.billed) > 0 ? aed(N(r.billed), r.currency) : "—"}</span>, sort: (r) => N(r.billed) },
    { key: "outstanding", header: "Outstanding", width: 150, align: "right", render: (r) => <span style={{ fontWeight: N(r.outstanding) > 0 ? 600 : 400, color: N(r.outstanding) > 0 ? color.status.critical : color.ink.soft, fontVariantNumeric: "tabular-nums" }}>{N(r.outstanding) > 0 ? aed(N(r.outstanding), r.currency) : "—"}</span>, sort: (r) => N(r.outstanding) },
  ];

  return (
    <AppShell active="customers">
      <PageTitleRow title="Customers" subtitle={`${rows.length} billing customer${rows.length === 1 ? "" : "s"}${totalOutstanding > 0 ? ` · ${aed(totalOutstanding, cur)} outstanding` : ""}`}
        actions={<div style={{ display: "flex", gap: 8 }}><ExportMenu entity="customers" /><Button onClick={() => { window.location.href = "/quotations/new"; }}>New quote</Button><Button variant="primary" onClick={() => { window.location.href = "/customers/new"; }}>+ New customer</Button></div>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Customers" value={String(rows.length)} note="billed" noteTone={color.ink.soft} />
        <KPICard label="Lifetime billed" value={aedShort(totalBilled)} note="all invoices" noteTone={color.brand.primary} />
        <KPICard label="Collected" value={aedShort(totalPaid)} note="paid in" noteTone={color.status.positive} />
        <KPICard label="Outstanding" value={aedShort(totalOutstanding)} note="to collect" noteTone={totalOutstanding > 0 ? color.status.critical : color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
        <div>
          {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
            : rows.length === 0 ? <EmptyState title="No customers yet" hint="Add a customer with tax treatment, or they\u2019re created automatically when you invoice." action={<Button variant="primary" onClick={() => { window.location.href = "/customers/new"; }}>+ New customer</Button>} />
              : <DataTable<Row> columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/customers/${r.id}`} searchable searchPlaceholder="Search customers…" title="All customers" initialSort={{ key: "outstanding", dir: "desc" }} maxHeight={620} />}
        </div>

        <Panel>
          <PanelHeader title="Top debtors" subtitle="Who owes the most" />
          <PanelBody flush>
            {debtors.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No outstanding balances. 🎉</div>
              : debtors.map((c) => (
                <a key={c.id} href={`/customers/${c.id}`} className="xui-row-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, textDecoration: "none", color: color.ink.DEFAULT }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0 }}><span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(c.name)}</span><span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span><span style={{ fontSize: 11.5, color: color.ink.soft }}>{c.invoiceCount} invoice{c.invoiceCount === 1 ? "" : "s"}</span></span></span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: color.status.critical, fontVariantNumeric: "tabular-nums" }}>{aed(N(c.outstanding), c.currency)}</span>
                </a>
              ))}
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}
