"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type CampaignRow = { id: string; name: string; channel: "Email" | "WhatsApp" | "SMS"; status: "active" | "scheduled" | "draft" | "done"; audience: number; openRate: number; replies: number };

const ALL: CampaignRow[] = [
  { id: "k1", name: "Ramadan villa offers", channel: "WhatsApp", status: "active", audience: 1240, openRate: 71, replies: 86 },
  { id: "k2", name: "Q3 fit-out newsletter", channel: "Email", status: "active", audience: 3180, openRate: 38, replies: 24 },
  { id: "k3", name: "Brokerage re-engagement", channel: "Email", status: "scheduled", audience: 540, openRate: 0, replies: 0 },
  { id: "k4", name: "New product launch — locks", channel: "SMS", status: "draft", audience: 0, openRate: 0, replies: 0 },
  { id: "k5", name: "Spring brochure blast", channel: "Email", status: "done", audience: 2760, openRate: 44, replies: 51 },
];

const STATUS: Record<CampaignRow["status"], { label: string; tone: BadgeTone }> = {
  active: { label: "active", tone: "positive" }, scheduled: { label: "scheduled", tone: "info" }, draft: { label: "draft", tone: "neutral" }, done: { label: "completed", tone: "neutral" },
};
const CHANNEL: Record<CampaignRow["channel"], BadgeTone> = { Email: "info", WhatsApp: "positive", SMS: "warning" };

const COLUMNS: Column<CampaignRow>[] = [
  { key: "name", header: "Campaign", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "channel", header: "Channel", width: 120, render: (r) => <StatusBadge tone={CHANNEL[r.channel]} label={r.channel} /> },
  { key: "audience", header: "Audience", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.audience ? r.audience.toLocaleString() : "—"}</span> },
  { key: "openRate", header: "Open rate", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600, color: r.openRate >= 50 ? color.status.positive : color.ink.DEFAULT }}>{r.audience ? r.openRate + "%" : "—"}</span> },
  { key: "replies", header: "Replies", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.audience ? r.replies : "—"}</span> },
];

const GROUPS: { id: CampaignRow["status"]; title: string; accent: string }[] = [
  { id: "active", title: "Active", accent: color.status.positive },
  { id: "scheduled", title: "Scheduled", accent: color.status.info },
  { id: "draft", title: "Drafts", accent: color.ink.soft },
  { id: "done", title: "Completed", accent: color.ink.mid },
];

export default function CampaignsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const visible = GROUPS.map((g) => ({ g, gr: rows.filter((r) => r.status === g.id) })).filter((x) => x.gr.length > 0);
  const reach = ALL.filter((r) => r.status === "active").reduce((s, r) => s + r.audience, 0);

  return (
    <AppShell active="campaigns">
      <PageTitleRow title="Campaigns" subtitle={`${ALL.length} campaigns · ${reach.toLocaleString()} active reach`} actions={<Button variant="primary">+ New campaign</Button>} />
      <FilterBar>
        <Input placeholder="Search campaigns…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Channel</Button>
        <Button>Status</Button>
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState title="No campaigns match your search" hint="Try a different name." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visible.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} />
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Campaign manager (monday-style) · locked DataTable + StatusBadge · tokens only</p>
    </AppShell>
  );
}
