"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type CallRow = { id: string; contact: string; company: string; direction: "in" | "out"; outcome: "missed" | "completed" | "scheduled" | "voicemail"; duration: string; when: string };

const ALL: CallRow[] = [
  { id: "c1", contact: "Paula Lenz", company: "Gulf Trading", direction: "in", outcome: "missed", duration: "—", when: "09:48" },
  { id: "c2", contact: "Aisha Rahman", company: "Skyline", direction: "out", outcome: "scheduled", duration: "—", when: "Today 15:00" },
  { id: "c3", contact: "Omar Haddad", company: "Damac", direction: "out", outcome: "completed", duration: "12m 30s", when: "09:05" },
  { id: "c4", contact: "Lena Fischer", company: "Al Noor", direction: "in", outcome: "voicemail", duration: "0m 42s", when: "Yesterday" },
  { id: "c5", contact: "Sara Khan", company: "Bright Interiors", direction: "out", outcome: "completed", duration: "6m 11s", when: "Yesterday" },
];

const aed = (s: string) => s;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Avatar({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">{initials(name)}</span>;
}

const TONE: Record<CallRow["outcome"], BadgeTone> = { missed: "critical", completed: "positive", scheduled: "info", voicemail: "warning" };

const COLUMNS: Column<CallRow>[] = [
  { key: "contact", header: "Contact", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Avatar name={r.contact} /><span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.contact}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.company}</span></span></span> },
  { key: "direction", header: "Direction", width: 110, render: (r) => <span style={{ color: color.ink.mid }}>{r.direction === "in" ? "↙ Inbound" : "↗ Outbound"}</span> },
  { key: "outcome", header: "Outcome", width: 130, render: (r) => <StatusBadge tone={TONE[r.outcome]} label={r.outcome} /> },
  { key: "duration", header: "Duration", width: 110, render: (r) => <span style={{ color: color.ink.mid }}>{r.duration}</span> },
  { key: "when", header: "When", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{aed(r.when)}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (o: CallRow["outcome"]) => boolean }[] = [
  { id: "cb", title: "Needs callback", accent: color.status.negative, match: (o) => o === "missed" || o === "voicemail" },
  { id: "sched", title: "Scheduled", accent: color.status.info, match: (o) => o === "scheduled" },
  { id: "done", title: "Completed", accent: color.status.positive, match: (o) => o === "completed" },
];

export default function CallsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.contact + r.company).toLowerCase().includes(q.toLowerCase()));
  const visible = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.outcome)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="calls">
      <PageTitleRow title="Calls" subtitle={`${ALL.length} calls · ${ALL.filter((r) => r.outcome === "missed" || r.outcome === "voicemail").length} need a callback`} actions={<Button variant="primary">+ Log call</Button>} />
      <FilterBar>
        <Input placeholder="Search calls…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Direction</Button>
        <Button>Outcome</Button>
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState title="No calls match your search" hint="Try a different contact or company." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
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
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Call log (monday-style) · locked DataTable + StatusBadge · tokens only</p>
    </AppShell>
  );
}
