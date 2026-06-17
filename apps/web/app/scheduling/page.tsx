"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, DataTable, StatusBadge, type Column, type BadgeTone } from "@xentral/ui";

type Link = { id: string; name: string; duration: string; booked: number; status: "active" | "paused" };
const LINKS: Link[] = [
  { id: "l1", name: "Discovery call (30 min)", duration: "30 min", booked: 42, status: "active" },
  { id: "l2", name: "Product demo (45 min)", duration: "45 min", booked: 28, status: "active" },
  { id: "l3", name: "Site visit booking", duration: "2 h", booked: 11, status: "active" },
  { id: "l4", name: "Quarterly review", duration: "60 min", booked: 0, status: "paused" },
];
const TONE: Record<Link["status"], BadgeTone> = { active: "positive", paused: "neutral" };
const COLS: Column<Link>[] = [
  { key: "name", header: "Booking link", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "duration", header: "Duration", width: 110, render: (r) => <span style={{ color: color.ink.mid }}>{r.duration}</span> },
  { key: "booked", header: "Booked (30d)", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.booked}</span> },
  { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
];

export default function SchedulingPage() {
  return (
    <AppShell active="scheduling">
      <PageTitleRow title="Scheduling" subtitle="Calendly-style booking links and availability" actions={<Button variant="primary">+ New link</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Booking links" value={String(LINKS.length)} note="published" noteTone={color.ink.soft} />
        <KPICard label="Booked (30d)" value={String(LINKS.reduce((s, l) => s + l.booked, 0))} note="meetings" noteTone={color.status.positive} />
        <KPICard label="Show rate" value="86%" note="attended" noteTone={color.ink.soft} />
        <KPICard label="Availability" value="Mon–Fri" note="09:00–18:00 GST" noteTone={color.ink.soft} />
      </div>
      <DataTable columns={COLS} rows={LINKS} getKey={(r) => r.id} />
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Scheduling · booking links · tokens-only, theme-aware</p>
    </AppShell>
  );
}
