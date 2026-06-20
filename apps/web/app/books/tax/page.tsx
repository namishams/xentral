"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, Panel, PanelHeader, PanelBody, DataTable, EmptyState, type Column } from "@xentral/ui";

type Doc = { id: string; doc: string; party: string; net: number; vat: number; type: string; date: string };
type Data = {
  currency: string; trn: string | null;
  period: { label: string; start: string; end: string; due: string };
  kpis: { outputVat: number; outputNet: number; outputCount: number; inputVat: number; inputNet: number; inputCount: number; netPayable: number; outputYTD: number };
  rows: Doc[];
};

export default function TaxPage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [empty, setEmpty] = React.useState(false);
  React.useEffect(() => {
    fetch("/api/books/vat").then((r) => r.json()).then((j) => {
      if (j.empty || j.error) { setEmpty(true); setLoading(false); return; }
      setD(j); setLoading(false);
    }).catch(() => { setEmpty(true); setLoading(false); });
  }, []);

  const cur = d?.currency || "AED";
  const aed = (n: number) => `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;

  const COLS: Column<Doc>[] = [
    { key: "doc", header: "Document", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.doc}</span> },
    { key: "party", header: "Party", render: (r) => <span style={{ color: color.ink.mid }}>{r.party}</span> },
    { key: "type", header: "Type", width: 110, render: (r) => <StatusBadge tone={r.type === "output" ? "info" : "neutral"} label={r.type === "output" ? "Output" : "Input"} /> },
    { key: "date", header: "Date", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.date}</span> },
    { key: "net", header: "Net", width: 120, align: "right", render: (r) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(r.net)}</span> },
    { key: "vat", header: "VAT", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(r.vat)}</span> },
  ];

  const box: React.CSSProperties = { background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px" };

  return (
    <AppShell active="tax">
      <PageTitleRow title="Tax Center" subtitle="UAE VAT (FTA 201) & Corporate Tax"
        badge={d?.trn ? <StatusBadge tone="positive" label={`TRN ${d.trn}`} /> : <StatusBadge tone="warning" label="No TRN set" />}
        actions={<a href="/books/settings" style={{ textDecoration: "none" }}><Button>Tax settings</Button></a>} />

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : empty || !d ? <EmptyState title="No tax data yet" hint="Issue invoices and record supplier bills — your VAT return (FTA 201) is calculated here automatically." action={<a href="/invoices/new" style={{ textDecoration: "none" }}><Button variant="primary">+ New invoice</Button></a>} />
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
                <KPICard label="Output VAT" value={aed(d.kpis.outputVat)} note={`${d.kpis.outputCount} sales`} noteTone={color.status.info} />
                <KPICard label="Input VAT" value={aed(d.kpis.inputVat)} note={`${d.kpis.inputCount} purchases`} noteTone={color.ink.soft} />
                <KPICard label="Net VAT payable" value={aed(d.kpis.netPayable)} note={d.kpis.netPayable >= 0 ? "due to FTA" : "reclaimable"} noteTone={d.kpis.netPayable >= 0 ? color.status.critical : color.status.positive} />
                <KPICard label="Output VAT YTD" value={aed(d.kpis.outputYTD)} note="this year" noteTone={color.brand.primary} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
                <Panel>
                  <PanelHeader title="VAT transactions" subtitle={`Current period · ${d.period.label}`} />
                  <PanelBody flush>
                    {d.rows.length === 0 ? <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: color.ink.soft }}>No taxable documents this period.</div>
                      : <DataTable<Doc> columns={COLS} rows={d.rows} getKey={(r) => r.id + r.type} />}
                  </PanelBody>
                </Panel>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={box}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 10px" }}>FTA VAT Return (201)</h3>
                    <Row k="Period" v={d.period.label} />
                    <Row k="From" v={d.period.start} />
                    <Row k="To" v={d.period.end} />
                    <Row k="Filing due" v={d.period.due} strong />
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 9, marginTop: 6, fontSize: 14, fontWeight: 800, color: color.ink.DEFAULT }}>
                      <span>Net payable</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{aed(d.kpis.netPayable)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 8 }}>Standard UAE VAT rate is 5%. File via the FTA EmaraTax portal by the due date.</div>
                  </div>

                  <div style={box}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 10px" }}>Corporate Tax (9%)</h3>
                    <div style={{ fontSize: 13, color: color.ink.mid, lineHeight: 1.5 }}>
                      UAE Corporate Tax is <strong>0%</strong> on the first <strong>AED 375,000</strong> of taxable profit and <strong>9%</strong> above it. Free-zone QFZP income can qualify for 0%.
                    </div>
                    <div style={{ marginTop: 10, padding: "9px 11px", background: color.surface.sunken, borderRadius: 8, fontSize: 13, color: color.ink.mid }}>
                      Indicative liability on YTD net (sales): <strong style={{ color: color.ink.DEFAULT }}>{aed(Math.max(0, (d.kpis.outputNet - 375000)) * 0.09)}</strong>
                      <div style={{ fontSize: 11, color: color.ink.soft, marginTop: 3 }}>Estimate only — final CT is on audited annual profit, not revenue.</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Tax Center · VAT auto-calculated from invoices &amp; bills · not a substitute for filing advice</p>
    </AppShell>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: color.ink.mid }}><span>{k}</span><span style={{ fontWeight: strong ? 700 : 500, color: strong ? color.ink.DEFAULT : color.ink.mid }}>{v}</span></div>;
}
