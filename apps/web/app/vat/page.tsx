"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

const KPIS: { label: string; value: string; note?: string; noteTone?: string }[] = [
  { label: "Output VAT (sales)", value: aed(20600), note: "Q2 to date", noteTone: color.ink.soft },
  { label: "Input VAT (purchases)", value: aed(7420), note: "recoverable", noteTone: color.ink.soft },
  { label: "Net VAT payable", value: aed(13180), note: "due to FTA", noteTone: color.status.critical },
  { label: "Next filing", value: "28 Jul", note: "VAT 201 · Q2", noteTone: color.status.info },
];

type TaxRow = { id: string; doc: string; party: string; net: number; vat: number; type: "output" | "input" };
const ROWS: TaxRow[] = [
  { id: "t1", doc: "INV-1043", party: "Al Noor Real Estate", net: 9500, vat: 475, type: "output" },
  { id: "t2", doc: "INV-1040", party: "Damac", net: 9900, vat: 495, type: "output" },
  { id: "t3", doc: "BILL-204", party: "Shenzhen Locks", net: 8400, vat: 420, type: "input" },
  { id: "t4", doc: "INV-1041", party: "Skyline", net: 12000, vat: 600, type: "output" },
  { id: "t5", doc: "BILL-198", party: "Gulf Print House", net: 3100, vat: 155, type: "input" },
];

const TONE: Record<TaxRow["type"], BadgeTone> = { output: "info", input: "neutral" };
const COLUMNS: Column<TaxRow>[] = [
  { key: "doc", header: "Document", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.doc}</span> },
  { key: "party", header: "Party", render: (r) => <span style={{ color: color.ink.mid }}>{r.party}</span> },
  { key: "type", header: "Type", width: 100, render: (r) => <StatusBadge tone={TONE[r.type]} label={r.type} /> },
  { key: "net", header: "Net", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{aed(r.net)}</span> },
  { key: "vat", header: "VAT 5%", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.vat)}</span> },
];

export default function VatPage() {
  return (
    <AppShell active="vat">
      <PageTitleRow title="VAT & Tax" subtitle="UAE Federal Tax Authority · 5% standard rate · TRN 100xxxxxxxxxxx3" actions={<Button variant="primary">Prepare VAT 201</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        {KPIS.map((k) => <KPICard key={k.label} {...k} />)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: color.brand.primaryTint, border: `1px solid ${color.brand.primaryTint}`, borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
        <span style={{ fontSize: 16, color: color.brand.primary }}>✦</span>
        <span style={{ fontSize: 13, color: color.brand.primary }}>Your Q2 return is on track. Net payable {aed(13180)} — file by 28 Jul to avoid an FTA late penalty.</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Recent taxable transactions</div>
      <DataTable columns={COLUMNS} rows={ROWS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>VAT center (UAE) · locked KPICard + DataTable + StatusBadge · tokens only</p>
    </AppShell>
  );
}
