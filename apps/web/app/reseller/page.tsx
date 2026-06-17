"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

type Ref = { id: string; company: string; plan: string; status: "trial" | "active" | "churned"; commission: number };
const REFS: Ref[] = [
  { id: "r1", company: "Coastal Logistics", plan: "Growth", status: "active", commission: 200 },
  { id: "r2", company: "Vertex Clinics", plan: "Growth", status: "active", commission: 200 },
  { id: "r3", company: "Nair Consulting", plan: "Starter", status: "trial", commission: 0 },
  { id: "r4", company: "Becker GmbH", plan: "Growth", status: "churned", commission: 0 },
];
const TONE: Record<Ref["status"], BadgeTone> = { active: "positive", trial: "info", churned: "neutral" };
const COLS: Column<Ref>[] = [
  { key: "company", header: "Referred company", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.company}</span> },
  { key: "plan", header: "Plan", width: 110, render: (r) => <StatusBadge tone="info" label={r.plan} /> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "commission", header: "Monthly commission", width: 170, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.commission)}</span> },
];

export default function ResellerPage() {
  const monthly = REFS.reduce((s, r) => s + r.commission, 0);
  const active = REFS.filter((r) => r.status === "active").length;
  return (
    <AppShell active="reseller">
      <PageTitleRow title="Reseller" subtitle="Refer customers, earn recurring commission" actions={<Button variant="primary">Copy referral link</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Monthly commission" value={aed(monthly)} note="recurring" noteTone={color.status.positive} />
        <KPICard label="Active referrals" value={String(active)} note={`of ${REFS.length}`} noteTone={color.ink.soft} />
        <KPICard label="Tier" value="Gold" note="25% lifetime" noteTone={color.brand.primary} />
        <KPICard label="Lifetime earned" value={aed(4800)} note="since Jan 2026" noteTone={color.ink.soft} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Your referrals</div>
      <DataTable columns={COLS} rows={REFS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Reseller portal · recurring commission · tokens-only, theme-aware</p>
    </AppShell>
  );
}
