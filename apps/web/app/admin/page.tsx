"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, KPICard, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";
import { listTenants, getSaasMetrics, listDisputes, listQuestions, listAnnouncements, type TenantRow, type DisputeRow, type QuestionRow, type AnnouncementRow } from "@xentral/module-platform";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const T_TONE: Record<string, BadgeTone> = { active: "positive", trial: "info", suspended: "critical" };
const D_TONE: Record<string, BadgeTone> = { open: "warning", escalated: "critical", resolved: "positive" };
const Q_TONE: Record<string, BadgeTone> = { open: "warning", answered: "positive" };
const A_TONE: Record<string, BadgeTone> = { published: "positive", draft: "neutral" };

const TABS = ["Overview", "Companies", "SaaS", "Disputes", "Questions", "Announcements"] as const;

export default function AdminPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Overview");
  const m = getSaasMetrics();
  const tenants = listTenants();
  const disputes = listDisputes();
  const questions = listQuestions();
  const anns = listAnnouncements();

  const tenantCols: Column<TenantRow>[] = [
    { key: "name", header: "Company", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
    { key: "plan", header: "Plan", width: 120, render: (r) => <StatusBadge tone="info" label={r.plan} /> },
    { key: "users", header: "Users", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.users}</span> },
    { key: "mrr", header: "MRR", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.mrr)}</span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={T_TONE[r.status]} label={r.status} /> },
    { key: "joined", header: "Joined", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.joined}</span> },
  ];
  const dCols: Column<DisputeRow>[] = [
    { key: "tenant", header: "Company", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.tenant}</span> },
    { key: "subject", header: "Subject", render: (r) => <span style={{ color: color.ink.mid }}>{r.subject}</span> },
    { key: "amount", header: "Amount", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.amount)}</span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={D_TONE[r.status]} label={r.status} /> },
    { key: "age", header: "Age", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.age}</span> },
  ];
  const qCols: Column<QuestionRow>[] = [
    { key: "tenant", header: "Company", width: 160, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.tenant}</span> },
    { key: "question", header: "Question", render: (r) => <span style={{ color: color.ink.mid }}>{r.question}</span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={Q_TONE[r.status]} label={r.status} /> },
    { key: "age", header: "Age", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.age}</span> },
  ];
  const aCols: Column<AnnouncementRow>[] = [
    { key: "title", header: "Announcement", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.title}</span> },
    { key: "audience", header: "Audience", width: 200, render: (r) => <span style={{ color: color.ink.mid }}>{r.audience}</span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={A_TONE[r.status]} label={r.status} /> },
    { key: "date", header: "Date", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.date}</span> },
  ];

  return (
    <AppShell active="admin">
      <PageTitleRow title="Admin Portal" subtitle="Platform operator — cross-tenant SaaS control" actions={<Button variant="primary">+ Announcement</Button>} />

      <div style={{ display: "flex", gap: 18, borderBottom: `1px solid ${color.line.DEFAULT}`, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 500, color: tab === t ? color.brand.primary : color.ink.mid, padding: "8px 0", borderBottom: tab === t ? `2px solid ${color.brand.primary}` : "2px solid transparent" }}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <KPICard label="MRR" value={aed(m.mrr)} note="monthly recurring" noteTone={color.status.positive} />
            <KPICard label="ARR" value={aed(m.arr)} note="annualised" noteTone={color.ink.soft} />
            <KPICard label="Active tenants" value={String(m.activeTenants)} note={`${m.trials} on trial`} noteTone={color.ink.soft} />
            <KPICard label="Churn" value={`${m.churnPct}%`} note={`▲ ${m.newThisMonth} new this month`} noteTone={color.status.positive} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Recent companies</div>
          <DataTable columns={tenantCols} rows={tenants} getKey={(r) => r.id} />
        </>
      )}
      {tab === "Companies" && <DataTable columns={tenantCols} rows={tenants} getKey={(r) => r.id} />}
      {tab === "SaaS" && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KPICard label="MRR" value={aed(m.mrr)} note="active tenants" noteTone={color.status.positive} />
          <KPICard label="ARR" value={aed(m.arr)} note="run-rate" noteTone={color.ink.soft} />
          <KPICard label="Active" value={String(m.activeTenants)} note="paying" noteTone={color.ink.soft} />
          <KPICard label="Trials" value={String(m.trials)} note="converting" noteTone={color.status.info} />
          <KPICard label="Churn" value={`${m.churnPct}%`} note="30-day" noteTone={color.ink.soft} />
        </div>
      )}
      {tab === "Disputes" && <DataTable columns={dCols} rows={disputes} getKey={(r) => r.id} />}
      {tab === "Questions" && <DataTable columns={qCols} rows={questions} getKey={(r) => r.id} />}
      {tab === "Announcements" && <DataTable columns={aCols} rows={anns} getKey={(r) => r.id} />}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Admin portal · @xentral/module-platform · seeded (no real PII) · tokens-only, theme-aware</p>
    </AppShell>
  );
}
