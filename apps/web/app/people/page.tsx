"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, KPICard, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listUsers, type UserRow } from "@xentral/module-platform";

const initials = (n: string) => n === "Nami" ? "N" : n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function PeoplePage() {
  const [q, setQ] = React.useState("");
  const ALL = listUsers();
  const rows = ALL.filter((u) => (u.name + u.email + u.role).toLowerCase().includes(q.toLowerCase()));
  const COLS: Column<UserRow>[] = [
    { key: "name", header: "Person", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><span style={{ width: 28, height: 28, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(r.name)}</span><span><span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.email}</span></span></span> },
    { key: "role", header: "Role", width: 130, render: (r) => <StatusBadge tone="info" label={r.role} /> },
    { key: "active", header: "Status", width: 110, render: (r) => <StatusBadge tone={r.active ? "positive" : "neutral"} label={r.active ? "active" : "inactive"} /> },
    { key: "lastLogin", header: "Last login", width: 120, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.lastLogin || "—"}</span> },
  ];
  return (
    <AppShell active="people">
      <PageTitleRow title="People" subtitle="Team directory — roles, status and activity" actions={<Button variant="primary">+ Invite</Button>} />
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Headcount" value={String(ALL.length)} note="members" noteTone={color.ink.soft} />
        <KPICard label="Active" value={String(ALL.filter((u) => u.active).length)} note="signed in recently" noteTone={color.status.positive} />
        <KPICard label="Roles" value={String(new Set(ALL.map((u) => u.role)).size)} note="distinct" noteTone={color.ink.soft} />
        <KPICard label="Seats" value={`${ALL.length}/25`} note="plan limit" noteTone={color.ink.soft} />
      </div>
      <FilterBar><Input placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} /></FilterBar>
      {rows.length === 0 ? <EmptyState title="No people match" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear</Button>} /> : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/users/${r.id}`} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>People directory · links to user records · tokens-only, theme-aware</p>
    </AppShell>
  );
}
