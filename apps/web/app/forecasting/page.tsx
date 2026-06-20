"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, DataTable, Panel, PanelHeader, PanelBody, EmptyState, type Column } from "@xentral/ui";

type StatusRow = { status: string; count: number; value: number; prob: number; weighted: number };
type Data = {
  currency: string;
  kpis: { openPipeline: number; weightedForecast: number; winRate: number; qtrBilled: number; collected: number; outstanding: number; openQuotes: number };
  byStatus: StatusRow[];
  trend: { label: string; total: number }[];
  top: { name: string; billed: number }[];
};
const tone = (s: string): "neutral" | "info" | "positive" | "warning" | "critical" => {
  if (["ACCEPTED", "CONVERTED", "PAID"].includes(s)) return "positive";
  if (["SENT", "PARTIALLY_PAID"].includes(s)) return "info";
  if (["DECLINED", "EXPIRED", "CANCELLED", "OVERDUE"].includes(s)) return "critical";
  return "neutral";
};

export default function ForecastingPage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [empty, setEmpty] = React.useState(false);
  React.useEffect(() => {
    fetch("/api/sales/forecast").then((r) => r.json()).then((j) => {
      if (j.empty || j.error) { setEmpty(true); setLoading(false); return; }
      setD(j); setLoading(false);
    }).catch(() => { setEmpty(true); setLoading(false); });
  }, []);

  const cur = d?.currency || "AED";
  const aed = (n: number) => `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;
  const aedShort = (n: number) => { n = Number(n) || 0; return n >= 1000 ? `${cur} ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${cur} ${Math.round(n)}`; };

  const COLS: Column<StatusRow>[] = [
    { key: "status", header: "Quote status", width: 150, render: (r) => <StatusBadge tone={tone(r.status)} label={r.status.toLowerCase()} /> },
    { key: "count", header: "Quotes", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.count}</span> },
    { key: "value", header: "Value", width: 150, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{aed(r.value)}</span> },
    { key: "prob", header: "Win prob.", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.prob}%</span> },
    { key: "weighted", header: "Weighted", width: 150, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{aed(r.weighted)}</span> },
  ];

  const maxTrend = d ? Math.max(1, ...d.trend.map((t) => t.total)) : 1;
  const maxTop = d ? Math.max(1, ...d.top.map((t) => t.billed)) : 1;

  return (
    <AppShell active="forecasting">
      <PageTitleRow title="Sales Forecast" subtitle="Probability-weighted pipeline & revenue — from quotes & invoices"
        actions={<a href="/quotations/new" style={{ textDecoration: "none" }}><Button variant="primary">+ New quote</Button></a>} />

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : empty || !d ? <EmptyState title="No sales data yet" hint="Create quotes and invoices — your weighted forecast, win rate and revenue trend build up here automatically." action={<a href="/quotations/new" style={{ textDecoration: "none" }}><Button variant="primary">+ New quote</Button></a>} />
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                <KPICard label="Open pipeline" value={aedShort(d.kpis.openPipeline)} note={`${d.kpis.openQuotes} open quotes`} noteTone={color.brand.primary} />
                <KPICard label="Weighted forecast" value={aedShort(d.kpis.weightedForecast)} note="probability-adjusted" noteTone={color.status.info} />
                <KPICard label="Win rate" value={`${d.kpis.winRate}%`} note="accepted / decided" noteTone={color.status.positive} />
                <KPICard label="Billed (quarter)" value={aedShort(d.kpis.qtrBilled)} note="this quarter" noteTone={color.ink.soft} />
                <KPICard label="Outstanding" value={aedShort(d.kpis.outstanding)} note="to collect" noteTone={d.kpis.outstanding > 0 ? color.status.critical : color.ink.soft} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
                <Panel>
                  <PanelHeader title="Forecast by quote status" subtitle="Weighted = value × win probability" />
                  <PanelBody flush>
                    {d.byStatus.length === 0 ? <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No quotes yet.</div>
                      : <DataTable columns={COLS} rows={d.byStatus} getKey={(r) => r.status} />}
                  </PanelBody>
                </Panel>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Panel>
                    <PanelHeader title="Revenue trend" subtitle="Invoiced · last 6 months" />
                    <PanelBody>
                      {d.trend.length === 0 ? <div style={{ fontSize: 13, color: color.ink.soft }}>No invoices yet.</div> : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                          {d.trend.map((t, i) => (
                            <div key={t.label + i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                              <div style={{ width: "100%", height: `${Math.max(4, (t.total / maxTrend) * 96)}px`, background: color.brand.primary, borderRadius: "5px 5px 0 0", opacity: 0.85 }} title={aed(t.total)} />
                              <span style={{ fontSize: 11, color: color.ink.soft }}>{t.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </PanelBody>
                  </Panel>
                  <Panel>
                    <PanelHeader title="Top customers" subtitle="By lifetime billed" />
                    <PanelBody flush>
                      {d.top.length === 0 ? <div style={{ padding: 16, fontSize: 13, color: color.ink.soft, textAlign: "center" }}>No customers yet.</div>
                        : d.top.map((c, i) => (
                          <div key={c.name + i} style={{ padding: "9px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: color.ink.DEFAULT, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{c.name}</span><span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{aed(c.billed)}</span></div>
                            <div style={{ height: 5, background: color.surface.sunken, borderRadius: 3 }}><div style={{ height: 5, width: `${(c.billed / maxTop) * 100}%`, background: color.brand.primary, borderRadius: 3 }} /></div>
                          </div>
                        ))}
                    </PanelBody>
                  </Panel>
                </div>
              </div>
            </>
          )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Sales forecast · live from quotes &amp; invoices · weighted pipeline</p>
    </AppShell>
  );
}
