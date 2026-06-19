"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, DataTable, Panel, PanelHeader, PanelBody, EmptyState, type Column } from "@xentral/ui";

type Acct = { code: string; name: string; type: string; debit: number; credit: number; balance: number };
type Data = {
  currency: string;
  kpis: { assets: number; liabilities: number; equity: number; income: number; expenses: number; netIncome: number; invCount: number; invSellable: number };
  balanced: boolean; totalDebit: number; totalCredit: number;
  accounts: Acct[];
  inventory: { count: number; sellable: number; purchasable: number; costBasis: number };
};
const typeTone = (t: string): "neutral" | "info" | "positive" | "warning" | "critical" =>
  t === "asset" ? "info" : t === "income" ? "positive" : t === "expense" ? "critical" : "neutral";

export default function ErpPage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [empty, setEmpty] = React.useState(false);
  React.useEffect(() => {
    fetch("/api/erp/overview").then((r) => r.json()).then((j) => {
      if (j.empty || j.error) { setEmpty(true); setLoading(false); return; }
      setD(j); setLoading(false);
    }).catch(() => { setEmpty(true); setLoading(false); });
  }, []);

  const cur = d?.currency || "AED";
  const aed = (n: number) => `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;
  const aedShort = (n: number) => { n = Number(n) || 0; const a = Math.abs(n); const s = a >= 1000 ? `${(n / 1000).toFixed(a >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`; return `${cur} ${s}`; };

  const COLS: Column<Acct>[] = [
    { key: "code", header: "Code", width: 80, render: (r) => <span style={{ color: color.ink.soft, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{r.code}</span> },
    { key: "name", header: "Account", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
    { key: "type", header: "Type", width: 110, render: (r) => <StatusBadge tone={typeTone(r.type)} label={r.type} /> },
    { key: "debit", header: "Debit", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.debit ? aed(r.debit) : "—"}</span> },
    { key: "credit", header: "Credit", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.credit ? aed(r.credit) : "—"}</span> },
    { key: "balance", header: "Balance", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{aed(r.balance)}</span> },
  ];

  return (
    <AppShell active="erp">
      <PageTitleRow title="ERP Overview" subtitle="General ledger trial balance, financial position & inventory"
        badge={d ? <StatusBadge tone={d.balanced ? "positive" : "critical"} label={d.balanced ? "GL balanced" : "Out of balance"} /> : null}
        actions={<span style={{ display: "inline-flex", gap: 8 }}><a href="/ledger" style={{ textDecoration: "none" }}><Button>Ledger</Button></a><a href="/inventory" style={{ textDecoration: "none" }}><Button>Inventory</Button></a></span>} />

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : empty || !d ? <EmptyState title="No ERP data yet" hint="Post invoices, bills and journals — your trial balance, financial position and inventory roll up here." action={<a href="/invoices/new" style={{ textDecoration: "none" }}><Button variant="primary">+ New invoice</Button></a>} />
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                <KPICard label="Total assets" value={aedShort(d.kpis.assets)} note="debit balances" noteTone={color.status.info} />
                <KPICard label="Liabilities" value={aedShort(d.kpis.liabilities)} note="owed" noteTone={color.ink.soft} />
                <KPICard label="Equity" value={aedShort(d.kpis.equity)} note="capital" noteTone={color.ink.soft} />
                <KPICard label="Net income" value={aedShort(d.kpis.netIncome)} note="income − expenses" noteTone={d.kpis.netIncome >= 0 ? color.status.positive : color.status.critical} />
                <KPICard label="Inventory items" value={String(d.kpis.invCount)} note={`${d.kpis.invSellable} sellable`} noteTone={color.brand.primary} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
                <Panel>
                  <PanelHeader title="Trial balance" subtitle={`Debits ${aed(d.totalDebit)} · Credits ${aed(d.totalCredit)}`} />
                  <PanelBody flush>
                    {d.accounts.length === 0 ? <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No posted journal lines yet.</div>
                      : <DataTable columns={COLS} rows={d.accounts} getKey={(r) => r.code + r.name} />}
                  </PanelBody>
                </Panel>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Panel>
                    <PanelHeader title="Financial position" subtitle="Assets = Liabilities + Equity + retained" />
                    <PanelBody>
                      <Row k="Assets" v={aed(d.kpis.assets)} strong />
                      <Row k="Liabilities" v={aed(d.kpis.liabilities)} />
                      <Row k="Equity" v={aed(d.kpis.equity)} />
                      <Row k="Income" v={aed(d.kpis.income)} />
                      <Row k="Expenses" v={aed(d.kpis.expenses)} />
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 9, marginTop: 6, fontSize: 14, fontWeight: 800, color: color.ink.DEFAULT }}><span>Net income</span><span style={{ color: d.kpis.netIncome >= 0 ? color.status.positive : color.status.negative, fontVariantNumeric: "tabular-nums" }}>{aed(d.kpis.netIncome)}</span></div>
                    </PanelBody>
                  </Panel>
                  <Panel>
                    <PanelHeader title="Inventory" subtitle="Active items" />
                    <PanelBody>
                      <Row k="Items" v={String(d.inventory.count)} />
                      <Row k="Sellable" v={String(d.inventory.sellable)} />
                      <Row k="Purchasable" v={String(d.inventory.purchasable)} />
                      <Row k="Cost basis" v={aed(d.inventory.costBasis)} />
                      <div style={{ marginTop: 10 }}><a href="/inventory" style={{ textDecoration: "none" }}><Button>Open inventory</Button></a></div>
                    </PanelBody>
                  </Panel>
                </div>
              </div>
            </>
          )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>ERP overview · live trial balance from the general ledger · tenant-scoped</p>
    </AppShell>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: color.ink.mid }}><span>{k}</span><span style={{ fontWeight: strong ? 700 : 600, color: color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{v}</span></div>;
}
