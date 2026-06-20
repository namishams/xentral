"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

type Emp = { id: string; name: string; role: string; salary: number; iban: string; status: "ready" | "hold" };
const EMP: Emp[] = [
  { id: "e1", name: "Sara Khan", role: "Sales Lead", salary: 14000, iban: "AE12 …5678", status: "ready" },
  { id: "e2", name: "Omar Haddad", role: "Account Exec", salary: 11000, iban: "AE45 …7766", status: "ready" },
  { id: "e3", name: "Lena Fischer", role: "Ops Manager", salary: 16000, iban: "AE93 …1224", status: "ready" },
  { id: "e4", name: "Tariq Aziz", role: "Support", salary: 8000, iban: "AE26 …3456", status: "hold" },
];
const TONE: Record<Emp["status"], BadgeTone> = { ready: "positive", hold: "warning" };

const COLS: Column<Emp>[] = [
  { key: "name", header: "Employee", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.role}</span></span> },
  { key: "iban", header: "IBAN", width: 140, render: (r) => <span style={{ color: color.ink.soft, fontSize: 13 }}>{r.iban}</span> },
  { key: "salary", header: "Net salary", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.salary)}</span> },
  { key: "status", header: "WPS status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function PayrollPage() {
  const total = EMP.reduce((s, e) => s + e.salary, 0);
  const ready = EMP.filter((e) => e.status === "ready").length;
  return (
    <AppShell active="payroll">
      <PageTitleRow title="Payroll" subtitle="UAE Wages Protection System (WPS) — generate the .SIF for the bank" actions={<Button variant="primary">Generate SIF</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Headcount" value={String(EMP.length)} note="on payroll" noteTone={color.ink.soft} />
        <KPICard label="Monthly payroll" value={aed(total)} note="net salaries" noteTone={color.ink.soft} />
        <KPICard label="Ready for WPS" value={`${ready}/${EMP.length}`} note="cleared" noteTone={color.status.positive} />
        <KPICard label="Next run" value="28 Jun" note="SIF due to bank" noteTone={color.status.info} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: color.brand.primaryTint, border: `1px solid ${color.brand.primary}22`, borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
        <span style={{ fontSize: 16, color: color.brand.primary }}>✦</span>
        <span style={{ fontSize: 13, color: color.brand.primary }}>1 employee is on hold (missing IBAN confirmation). Resolve before generating the WPS SIF file.</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Employees</div>
      <DataTable columns={COLS} rows={EMP} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Payroll (WPS) · locked KPICard + DataTable · tokens-only, theme-aware</p>
    </AppShell>
  );
}
