"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StagePill, type Column } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

const KPIS: { label: string; value: string; note?: string; noteTone?: string }[] = [
  { label: "Committed", value: aed(184000), note: "high confidence", noteTone: color.status.positive },
  { label: "Best case", value: aed(372000), note: "incl. upside", noteTone: color.status.info },
  { label: "Weighted pipeline", value: aed(248500), note: "probability-adjusted", noteTone: color.ink.soft },
  { label: "Quota attainment", value: "74%", note: "AED 250k target", noteTone: color.status.critical },
];

type StageRow = { id: string; stage: string; count: number; value: number; prob: number; weighted: number };
const ROWS: StageRow[] = [
  { id: "s1", stage: "qualified", count: 14, value: 168000, prob: 30, weighted: 50400 },
  { id: "s2", stage: "proposal", count: 9, value: 142000, prob: 55, weighted: 78100 },
  { id: "s3", stage: "negotiation", count: 6, value: 120000, prob: 75, weighted: 90000 },
  { id: "s4", stage: "won", count: 11, value: 184000, prob: 100, weighted: 184000 },
];

const COLUMNS: Column<StageRow>[] = [
  { key: "stage", header: "Stage", width: 150, render: (r) => <StagePill stage={r.stage} /> },
  { key: "count", header: "Deals", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.count}</span> },
  { key: "value", header: "Open value", width: 140, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{aed(r.value)}</span> },
  { key: "prob", header: "Win prob.", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.prob}%</span> },
  { key: "weighted", header: "Weighted", width: 140, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{aed(r.weighted)}</span> },
];

export default function ForecastingPage() {
  return (
    <AppShell active="forecasting">
      <PageTitleRow title="Forecasting" subtitle="Probability-weighted revenue forecast · this quarter" actions={<Button variant="primary">Adjust quota</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        {KPIS.map((k) => <KPICard key={k.label} {...k} />)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Forecast by stage</div>
      <DataTable columns={COLUMNS} rows={ROWS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Revenue forecast · locked KPICard + DataTable + StagePill · pastel stage tokens</p>
    </AppShell>
  );
}
