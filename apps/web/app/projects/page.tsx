"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type ProjectRow = { id: string; name: string; client: string; lead: string; status: "active" | "hold" | "done"; progress: number; due: string };

const ALL: ProjectRow[] = [
  { id: "p1", name: "Skyline Tower fit-out", client: "Skyline", lead: "Sara Khan", status: "active", progress: 62, due: "Aug 12" },
  { id: "p2", name: "Damac villa reception", client: "Damac", lead: "Omar Haddad", status: "active", progress: 35, due: "Sep 02" },
  { id: "p3", name: "Al Noor brochure rollout", client: "Al Noor", lead: "Lena Fischer", status: "hold", progress: 20, due: "TBD" },
  { id: "p4", name: "Gulf office relocation", client: "Gulf Trading", lead: "Nami", status: "active", progress: 8, due: "Oct 01" },
  { id: "p5", name: "Brokerage retainer onboarding", client: "Brokerage Co", lead: "Nami", status: "done", progress: 100, due: "Done" },
];

const initials = (name: string) => name === "Nami" ? "N" : name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Avatar({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center" }} aria-hidden="true">{initials(name)}</span>;
}
function Progress({ pct }: { pct: number }) {
  const c = pct === 100 ? color.status.positive : pct < 25 ? color.status.critical : color.brand.primary;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "100%" }}>
      <span style={{ flex: 1, height: 6, borderRadius: 3, background: color.surface.sunken, overflow: "hidden", minWidth: 60 }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`, background: c }} />
      </span>
      <span style={{ fontSize: 12, color: color.ink.mid, width: 34, textAlign: "right" }}>{pct}%</span>
    </span>
  );
}

const TONE: Record<ProjectRow["status"], { label: string; tone: BadgeTone }> = { active: { label: "active", tone: "positive" }, hold: { label: "on hold", tone: "warning" }, done: { label: "completed", tone: "neutral" } };
const COLUMNS: Column<ProjectRow>[] = [
  { key: "name", header: "Project", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{r.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{r.client}</span></span> },
  { key: "lead", header: "Lead", width: 80, render: (r) => <Avatar name={r.lead} /> },
  { key: "progress", header: "Progress", width: 180, render: (r) => <Progress pct={r.progress} /> },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={TONE[r.status].tone} label={TONE[r.status].label} /> },
  { key: "due", header: "Due", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.soft }}>{r.due}</span> },
];

const GROUPS: { id: ProjectRow["status"]; title: string; accent: string }[] = [
  { id: "active", title: "Active", accent: color.status.positive },
  { id: "hold", title: "On hold", accent: color.status.critical },
  { id: "done", title: "Completed", accent: color.ink.soft },
];

export default function ProjectsPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.name + r.client + r.lead).toLowerCase().includes(q.toLowerCase()));
  const visible = GROUPS.map((g) => ({ g, gr: rows.filter((r) => r.status === g.id) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="projects">
      <PageTitleRow title="Projects" subtitle={`${ALL.length} projects · ${ALL.filter((r) => r.status === "active").length} active`} actions={<Button variant="primary">+ New project</Button>} />
      <FilterBar>
        <Input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <Button>Lead</Button>
        <Button>Status</Button>
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState title="No projects match your search" hint="Try a different name or client." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
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
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Projects (monday-style) · locked DataTable + StatusBadge · tokens only</p>
    </AppShell>
  );
}
