"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

type Account = { code: string; name: string; type: "Asset" | "Liability" | "Equity" | "Income" | "Expense"; balance: number };
const ACCOUNTS: Account[] = [
  { code: "1000", name: "Cash & bank", type: "Asset", balance: 664500 },
  { code: "1100", name: "Accounts receivable", type: "Asset", balance: 53300 },
  { code: "1300", name: "Inventory", type: "Asset", balance: 41000 },
  { code: "2000", name: "Accounts payable", type: "Liability", balance: 38600 },
  { code: "2100", name: "VAT payable", type: "Liability", balance: 13180 },
  { code: "3000", name: "Owner's equity", type: "Equity", balance: 500000 },
  { code: "4000", name: "Sales revenue", type: "Income", balance: 682320 },
  { code: "5000", name: "Cost of sales", type: "Expense", balance: 222790 },
];
const TYPE_TONE = { Asset: "info", Liability: "warning", Equity: "neutral", Income: "positive", Expense: "critical" } as const;

type Entry = { id: string; date: string; ref: string; memo: string; debit: number; credit: number };
const ENTRIES: Entry[] = [
  { id: "j1", date: "17 Jun", ref: "INV-1043", memo: "Sales invoice — Al Noor", debit: 15225, credit: 0 },
  { id: "j2", date: "17 Jun", ref: "INV-1043", memo: "VAT output", debit: 0, credit: 725 },
  { id: "j3", date: "16 Jun", ref: "PAY-5521", memo: "Payment received — Skyline", debit: 32000, credit: 0 },
  { id: "j4", date: "15 Jun", ref: "BILL-771", memo: "Supplier bill — Emirates Steel", debit: 0, credit: 22000 },
];

const ACCT_COLS: Column<Account>[] = [
  { key: "code", header: "Code", width: 80, render: (r) => <span style={{ color: color.ink.soft }}>{r.code}</span> },
  { key: "name", header: "Account", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "type", header: "Type", width: 120, render: (r) => <StatusBadge tone={TYPE_TONE[r.type]} label={r.type} /> },
  { key: "balance", header: "Balance", width: 150, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.balance)}</span> },
];
const ENTRY_COLS: Column<Entry>[] = [
  { key: "date", header: "Date", width: 80, render: (r) => <span style={{ color: color.ink.soft }}>{r.date}</span> },
  { key: "ref", header: "Ref", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.ref}</span> },
  { key: "memo", header: "Memo", render: (r) => <span style={{ color: color.ink.mid }}>{r.memo}</span> },
  { key: "debit", header: "Debit", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.debit ? aed(r.debit) : "—"}</span> },
  { key: "credit", header: "Credit", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.credit ? aed(r.credit) : "—"}</span> },
];

export default function LedgerPage() {
  const assets = ACCOUNTS.filter((a) => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
  const income = ACCOUNTS.filter((a) => a.type === "Income").reduce((s, a) => s + a.balance, 0);
  const expense = ACCOUNTS.filter((a) => a.type === "Expense").reduce((s, a) => s + a.balance, 0);
  return (
    <AppShell active="ledger">
      <PageTitleRow title="General Ledger" subtitle="Chart of accounts and journal — double-entry, IFRS-aligned" actions={<Button variant="primary">New journal</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Total assets" value={aed(assets)} note="on balance sheet" noteTone={color.ink.soft} />
        <KPICard label="Revenue (YTD)" value={aed(income)} note="recognised" noteTone={color.status.positive} />
        <KPICard label="Expenses (YTD)" value={aed(expense)} note="cost of sales" noteTone={color.status.critical} />
        <KPICard label="Net profit" value={aed(income - expense)} note="before tax" noteTone={color.status.positive} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Chart of accounts</div>
      <DataTable columns={ACCT_COLS} rows={ACCOUNTS} getKey={(r) => r.code} />
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, margin: "20px 0 8px" }}>Recent journal entries</div>
      <DataTable columns={ENTRY_COLS} rows={ENTRIES} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>General Ledger · locked KPICard + DataTable · tokens-only, theme-aware</p>
    </AppShell>
  );
}
