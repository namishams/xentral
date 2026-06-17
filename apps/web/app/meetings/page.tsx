"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type MeetingRow = { id: string; title: string; withWhom: string; company: string; kind: "video" | "onsite" | "call"; bucket: "today" | "week" | "later"; when: string };

const ALL: MeetingRow[] = [
  { id: "m1", title: "Fit-out walkthrough", withWhom: "Aisha Rahman", company: "Skyline", kind: "onsite", bucket: "today", when: "Today 15:00" },
  { id: "m2", title: "Quote review Q-3009", withWhom: "Paula Lenz", company: "Gulf Trading", kind: "video", bucket: "today", when: "Today 17:30" },
  { id: "m3", title: "Villa portfolio pitch", withWhom: "Omar Haddad", company: "Damac", kind: "video", bucket: "week", when: "Thu 11:00" },
  { id: "m4", title: "Reorder call", withWhom: "Lena Fischer", company: "Al Noor", kind: "call", bucket: "week", when: "Fri 10:00" },
  { id: "m5", title: "Quarterly business review", withWhom: "Sara Khan", company: "Bright Interiors", kind: "onsite", bucket: "later", when: "Jun 24, 14:00" },
];

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Avatar({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">{initials(name)}</span>;
}

const KIND: Record<MeetingRow["kind"], { label: string; tone: BadgeTone }> = { video: { label: "video", tone: "info" }, onsite: { label: "on-site", tone: "positive" }, call: { label: "call", tone: "neutral" } };

const COLUMNS: Column<MeetingRow>[] = [
  { key: "title", header: "Meeting", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.title}</span> },
  { key: "withWhom", header: "With", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Avatar name={r.withWhom} /><span><span style={{ color: color.ink.DEFAULT, display: "block" }}>{r.withWhom}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.company}</span></span></span> },
  { key: "kind", header: "Type", width: 110, render: (r) => <StatusBadge tone={KIND[r.kind].tone} label={KIND[r.kind].label} /> },
  { key: "when", header: "When", width: 150, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.when}</span> },
];

const GROUPS: { id: MeetingRow["bucket"]; title: string; accent: string }[] = [
  { id: "today", title: "Today", accent: color.status.info },
  { id: "week", title: "This week", accent: color.brand.primary },
  { id: "later", title: "Later", accent: color.ink.soft },
];

export default function MeetingsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.title + r.withWhom + r.company).toLowerCase().includes(q.toLowerCase()));
  const visible = GROUPS.map((g) => ({ g, gr: rows.filter((r) => r.bucket === g.id) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="meetings">
      <PageTitleRow title="Meetings" subtitle={`${ALL.length} upcoming · ${ALL.filter((r) => r.bucket === "today").length} today`} actions={<Button variant="primary">+ Schedule</Button>} />
      <FilterBar>
        <Input placeholder="Search meetings…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Type</Button>
        <Button>Owner</Button>
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState title="No meetings match your search" hint="Try a different title or attendee." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
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
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Upcoming meetings (monday-style) · locked DataTable + StatusBadge · tokens only</p>
    </AppShell>
  );
}
