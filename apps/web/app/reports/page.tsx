"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button } from "@xentral/ui";

const KPIS: { label: string; value: string; note?: string; noteTone?: string }[] = [
  { label: "Revenue MTD", value: "AED 412k", note: "▲ 18% vs last month", noteTone: color.status.positive },
  { label: "New deals", value: "37", note: "▲ 6 this week", noteTone: color.status.positive },
  { label: "Win rate", value: "42%", note: "▼ 3pts", noteTone: color.status.negative },
  { label: "Collections", value: "AED 286k", note: "91% on time", noteTone: color.ink.soft },
];

const REPORTS: { id: string; title: string; desc: string; glyph: string; accent: string }[] = [
  { id: "rev", title: "Revenue", desc: "Booked, recognised & forecast revenue by month, owner and product.", glyph: "₳", accent: color.status.positive },
  { id: "pipe", title: "Pipeline", desc: "Stage conversion, velocity and aging across the sales funnel.", glyph: "⌗", accent: color.status.info },
  { id: "act", title: "Activity", desc: "Calls, meetings and emails per rep — leading indicators.", glyph: "✶", accent: color.brand.primary },
  { id: "ar", title: "Receivables", desc: "Aging buckets, DSO and overdue exposure by customer.", glyph: "⏳", accent: color.status.critical },
  { id: "vat", title: "VAT & tax", desc: "Output/input VAT, net position and FTA filing readiness.", glyph: "%", accent: color.ink.mid },
  { id: "cust", title: "Customers", desc: "Top accounts, retention and lifetime value cohorts.", glyph: "◍", accent: color.status.info },
];

export default function ReportsPage() {
  return (
    <AppShell active="reports">
      <PageTitleRow title="Reports" subtitle="Your business at a glance — drill into any area" actions={<Button variant="primary">Export</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {KPIS.map((k) => <KPICard key={k.label} {...k} />)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 10 }}>Report library</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {REPORTS.map((r) => (
          <button key={r.id} style={{ textAlign: "left", background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 9, background: r.accent + "1a", color: r.accent, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.glyph}</span>
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 3 }}>{r.title}</span>
              <span style={{ display: "block", fontSize: 12.5, color: color.ink.soft, lineHeight: "18px" }}>{r.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 22 }}>Reporting hub · locked KPICard + tokens only</p>
    </AppShell>
  );
}
