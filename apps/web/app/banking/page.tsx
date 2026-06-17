"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Bank = { id: string; name: string; account: string; balance: number; uncleared: number; status: "reconciled" | "pending" };
const BANKS: Bank[] = [
  { id: "b1", name: "WIO Bank — Current", account: "AE93 0860 0000 0920 1081 224", balance: 412300, uncleared: 9500, status: "pending" },
  { id: "b2", name: "Emirates NBD — Savings", account: "AE12 0260 0010 1234 5678 901", balance: 188000, uncleared: 0, status: "reconciled" },
  { id: "b3", name: "Mashreq — USD", account: "AE45 0330 0000 9988 7766 554", balance: 64200, uncleared: 1200, status: "pending" },
];
const TONE: Record<Bank["status"], BadgeTone> = { reconciled: "positive", pending: "warning" };

const COLUMNS: Column<Bank>[] = [
  { key: "name", header: "Account", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.account}</span></span> },
  { key: "balance", header: "Balance", width: 150, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.balance)}</span> },
  { key: "uncleared", header: "Uncleared", width: 130, align: "right", render: (r) => <span style={{ color: r.uncleared > 0 ? color.status.critical : color.ink.soft }}>{aed(r.uncleared)}</span> },
  { key: "status", header: "Reconciliation", width: 140, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function BankingPage() {
  const cash = BANKS.reduce((s, b) => s + b.balance, 0);
  const uncleared = BANKS.reduce((s, b) => s + b.uncleared, 0);
  return (
    <AppShell active="banking">
      <PageTitleRow title="Banking" subtitle="Cash positions and reconciliation across all accounts" actions={<Button variant="primary">Reconcile</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Total cash" value={aed(cash)} note="all accounts" noteTone={color.status.positive} />
        <KPICard label="Uncleared" value={aed(uncleared)} note="awaiting clearance" noteTone={color.status.critical} />
        <KPICard label="Accounts" value={String(BANKS.length)} note="connected" noteTone={color.ink.soft} />
        <KPICard label="Last sync" value="Today" note="09:40 GST" noteTone={color.ink.soft} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Bank accounts</div>
      <DataTable columns={COLUMNS} rows={BANKS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Banking · locked KPICard + DataTable · tokens-only, theme-aware</p>
    </AppShell>
  );
}
