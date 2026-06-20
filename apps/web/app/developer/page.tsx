"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type Hook = { id: string; event: string; url: string; status: "active" | "failing" };
const HOOKS: Hook[] = [
  { id: "h1", event: "invoice.paid", url: "https://api.icsl.ae/hooks/paid", status: "active" },
  { id: "h2", event: "lead.created", url: "https://api.icsl.ae/hooks/lead", status: "active" },
  { id: "h3", event: "deal.won", url: "https://hooks.zapier.com/…", status: "failing" },
];
const TONE: Record<Hook["status"], BadgeTone> = { active: "positive", failing: "critical" };
const HCols: Column<Hook>[] = [
  { key: "event", header: "Event", width: 170, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT, fontFamily: "monospace", fontSize: 13 }}>{r.event}</span> },
  { key: "url", header: "Endpoint", render: (r) => <span style={{ color: color.ink.soft, fontSize: 13 }}>{r.url}</span> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function DeveloperPage() {
  return (
    <AppShell active="developer">
      <PageTitleRow title="Developer" subtitle="REST API, webhooks, API keys and white-label" actions={<Button variant="primary">API docs</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="API calls (24h)" value="18,402" note="across keys" noteTone={color.ink.soft} />
        <KPICard label="Webhooks" value={String(HOOKS.length)} note={`${HOOKS.filter((h) => h.status === "failing").length} failing`} noteTone={color.status.critical} />
        <KPICard label="API keys" value="3" note="active" noteTone={color.ink.soft} />
        <KPICard label="Rate limit" value="600/min" note="current plan" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginBottom: 18 }}>
        {[["REST API", "Full CRUD over every module"], ["Webhooks", "Real-time event push"], ["White-label", "Your brand, your domain"], ["LLM-ready", "MCP + structured endpoints"]].map(([t, d]) => (
          <div key={t} style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{t}</div>
            <div style={{ fontSize: 13, color: color.ink.soft, marginTop: 3 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 8 }}>Webhooks</div>
      <DataTable columns={HCols} rows={HOOKS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Developer · API · webhooks · white-label · tokens-only, theme-aware</p>
    </AppShell>
  );
}
