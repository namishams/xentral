"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type TaskRow = { id: string; title: string; about: string; owner: string; kind: "call" | "email" | "follow-up" | "quote"; bucket: "overdue" | "today" | "upcoming"; due: string };

const ALL: TaskRow[] = [
  { id: "w1", title: "Call back Paula — missed", about: "Gulf Trading", owner: "You", kind: "call", bucket: "overdue", due: "Yesterday" },
  { id: "w2", title: "Send revised quote Q-3009", about: "Gulf Trading", owner: "You", kind: "quote", bucket: "overdue", due: "Mon" },
  { id: "w3", title: "Confirm Thursday site visit", about: "Skyline", owner: "You", kind: "follow-up", bucket: "today", due: "Today 12:00" },
  { id: "w4", title: "Email brochure pack quote", about: "Al Noor", owner: "You", kind: "email", bucket: "today", due: "Today 16:00" },
  { id: "w5", title: "Villa portfolio follow-up", about: "Damac", owner: "Omar", kind: "follow-up", bucket: "upcoming", due: "Thu" },
  { id: "w6", title: "QBR prep deck", about: "Bright Interiors", owner: "Sara", kind: "follow-up", bucket: "upcoming", due: "Jun 24" },
];

const initials = (name: string) => name === "You" ? "Y" : name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Avatar({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">{initials(name)}</span>;
}
const KIND: Record<TaskRow["kind"], BadgeTone> = { call: "warning", email: "info", "follow-up": "neutral", quote: "positive" };

const COLUMNS: Column<TaskRow>[] = [
  { key: "title", header: "Task", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.title}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.about}</span></span> },
  { key: "kind", header: "Type", width: 110, render: (r) => <StatusBadge tone={KIND[r.kind]} label={r.kind} /> },
  { key: "owner", header: "Owner", width: 90, render: (r) => <Avatar name={r.owner} /> },
  { key: "due", header: "Due", width: 130, align: "right", render: (r) => <span style={{ color: r.bucket === "overdue" ? color.status.negative : color.ink.soft, fontWeight: r.bucket === "overdue" ? 600 : 400 }}>{r.due}</span> },
];

const GROUPS: { id: TaskRow["bucket"]; title: string; accent: string }[] = [
  { id: "overdue", title: "Overdue", accent: color.status.negative },
  { id: "today", title: "Today", accent: color.status.info },
  { id: "upcoming", title: "Upcoming", accent: color.ink.soft },
];

export default function WorkQueuePage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.title + r.about + r.owner).toLowerCase().includes(q.toLowerCase()));
  const visible = GROUPS.map((g) => ({ g, gr: rows.filter((r) => r.bucket === g.id) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="work-queue">
      <PageTitleRow title="Work queue" subtitle={`${ALL.length} tasks · ${ALL.filter((r) => r.bucket === "overdue").length} overdue`} actions={<Button variant="primary">+ New task</Button>} />
      <FilterBar>
        <Input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Type</Button>
        <Button>Owner</Button>
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState title="Nothing in your queue" hint="You're all caught up." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
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
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Personal work queue (monday-style) · locked DataTable + StatusBadge · tokens only</p>
    </AppShell>
  );
}
