"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, Panel, PanelHeader, PanelBody, EmptyState, AskAiButton, type Column, type BadgeTone } from "@xentral/ui";

type Tx = { id: string; doc: string; party: string; net: number; vat: number; type: "output" | "input"; date: string };
type Data = {
  currency: string; trn: string | null;
  period: { label: string; start: string; end: string; due: string };
  kpis: { outputVat: number; outputNet: number; outputCount: number; inputVat: number; inputNet: number; inputCount: number; netPayable: number; outputYTD: number };
  rows: Tx[];
};

const N = (v: unknown) => Number(v) || 0;
const aed = (n: number) => `AED ${N(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const TONE: Record<Tx["type"], BadgeTone> = { output: "info", input: "neutral" };

export default function VatPage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/books/vat").then((r) => r.json()).then((j) => { setD(j.empty || j.error ? null : j); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const k = d?.kpis;
  const COLS: Column<Tx>[] = [
    { key: "doc", header: "Document", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.doc}</span>, sort: (r) => r.doc, filterText: (r) => `${r.doc} ${r.party}` },
    { key: "party", header: "Party", render: (r) => <span style={{ color: color.ink.mid }}>{r.party}</span>, sort: (r) => (r.party || "").toLowerCase() },
    { key: "type", header: "Type", width: 100, render: (r) => <StatusBadge tone={TONE[r.type]} label={r.type === "output" ? "sales" : "purchase"} />, sort: (r) => r.type },
    { key: "date", header: "Date", width: 120, render: (r) => <span style={{ color: color.ink.mid }}>{r.date}</span> },
    { key: "net", header: "Net", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{aed(r.net)}</span>, sort: (r) => r.net },
    { key: "vat", header: "VAT", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(r.vat)}</span>, sort: (r) => r.vat },
  ];

  const sumRow = (label: string, value: string, tone?: string, dim?: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, color: dim ? color.ink.soft : color.ink.mid }}><span>{label}</span><span style={{ fontWeight: 600, color: tone ?? color.ink.DEFAULT, fontVariantNumeric: "tabular-nums" }}>{value}</span></div>
  );

  return (
    <AppShell active="vat">
      <PageTitleRow title="VAT & Tax" subtitle={`UAE Federal Tax Authority · 5% standard rate${d?.trn ? ` · TRN ${d.trn}` : ""}`}
        actions={<div style={{ display: "flex", gap: 8 }}><AskAiButton label="Ask AI" seed="Summarise my VAT position this quarter and what I need to do before the filing deadline." /><Button variant="primary" onClick={() => window.print()}>Prepare VAT 201</Button></div>} />

      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : !d ? <EmptyState title="No tax data yet" hint="VAT is calculated automatically from your invoices and bills." action={<Button variant="primary" onClick={() => { window.location.href = "/invoices/new"; }}>+ New invoice</Button>} />
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
                <KPICard label="Output VAT (sales)" value={aed(k!.outputVat)} note={`${d.period.label} · ${k!.outputCount} invoices`} noteTone={color.ink.soft} />
                <KPICard label="Input VAT (purchases)" value={aed(k!.inputVat)} note={`recoverable · ${k!.inputCount} bills`} noteTone={color.ink.soft} />
                <KPICard label="Net VAT payable" value={aed(k!.netPayable)} note={k!.netPayable >= 0 ? "due to FTA" : "refund due"} noteTone={k!.netPayable >= 0 ? color.status.critical : color.status.positive} />
                <KPICard label="Next filing" value={d.period.due} note={`VAT 201 · ${d.period.label}`} noteTone={color.status.info} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, background: color.brand.primaryTint, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <span style={{ fontSize: 16, color: color.brand.primary }}>✦</span>
                <span style={{ fontSize: 13, color: color.brand.primary }}>{k!.netPayable >= 0
                  ? `Your ${d.period.label} return shows ${aed(k!.netPayable)} net payable — file VAT 201 by ${d.period.due} to avoid an FTA late penalty.`
                  : `Your ${d.period.label} return shows a ${aed(Math.abs(k!.netPayable))} refund position — file VAT 201 by ${d.period.due}.`}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 8 }}>Taxable transactions · {d.period.label}</div>
                  {d.rows.length === 0 ? <EmptyState title="No taxable transactions" hint={`No invoices or bills dated within ${d.period.label}.`} />
                    : <DataTable<Tx> columns={COLS} rows={d.rows} getKey={(r) => r.id} searchable searchPlaceholder="Search document or party…" title={`${d.rows.length} transactions`} initialSort={{ key: "date", dir: "desc" }} maxHeight={560} />}
                </div>

                <Panel>
                  <PanelHeader title={`VAT 201 · ${d.period.label}`} subtitle={`${d.period.start} – ${d.period.end}`} />
                  <PanelBody>
                    {sumRow("Output VAT (sales)", aed(k!.outputVat))}
                    {sumRow("Input VAT (purchases)", `– ${aed(k!.inputVat)}`)}
                    <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 15, fontWeight: 800, color: color.ink.DEFAULT }}><span>Net payable</span><span style={{ color: k!.netPayable >= 0 ? color.status.critical : color.status.positive, fontVariantNumeric: "tabular-nums" }}>{aed(k!.netPayable)}</span></div>
                    <div style={{ marginTop: 8, padding: "10px 12px", background: color.surface.sunken, borderRadius: 8, fontSize: 12, color: color.ink.mid }}>
                      Filing due <strong style={{ color: color.ink.DEFAULT }}>{d.period.due}</strong><br />
                      Taxable sales (net): {aed(k!.outputNet)}<br />
                      Taxable purchases (net): {aed(k!.inputNet)}<br />
                      Output VAT YTD: {aed(k!.outputYTD)}
                    </div>
                    <div style={{ marginTop: 12 }}><Button variant="primary" onClick={() => window.print()}>Prepare VAT 201</Button></div>
                  </PanelBody>
                </Panel>
              </div>
            </>
          )}
    </AppShell>
  );
}
