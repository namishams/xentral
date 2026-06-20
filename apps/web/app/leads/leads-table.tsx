"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { KPICard, Input, Button, DataTable, StagePill, EmptyState, type Column } from "@xentral/ui";
import type { LeadRow } from "@xentral/module-crm";

/* Faithful port of the live app's Leads board: KPI band -> search + owner chips ->
 * stage-grouped tables with avatar + score meter. DataPort rows, tokens only. */

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const ACCENTS = ["#0064d9", "#188918", "#9a5800", "#0e7490", "#6b3fd4", "#b3261e"];
const accentFor = (s: string) => ACCENTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length];

function Avatar({ name }: { name: string }) {
  const a = accentFor(name);
  return <span aria-hidden="true" style={{ display: "inline-flex", width: 28, height: 28, borderRadius: "50%", background: `color-mix(in srgb, ${a} 14%, ${color.surface.card})`, color: a, fontSize: 11, fontWeight: 700, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(name)}</span>;
}

function scoreColor(score: number): string {
  return score >= 75 ? color.status.positive : score >= 50 ? color.status.critical : color.ink.soft;
}
function ScoreMeter({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 90 }}>
      <span style={{ position: "relative", width: 54, height: 6, borderRadius: 3, background: color.surface.sunken, overflow: "hidden" }}>
        <span style={{ position: "absolute", inset: 0, width: `${score}%`, background: c, borderRadius: 3 }} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </span>
  );
}

const COLUMNS: Column<LeadRow>[] = [
  { key: "name", header: "Lead", render: (r) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar name={r.name} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT, lineHeight: "16px" }}>{r.name}</span>
        <span style={{ display: "block", fontSize: 12, color: color.ink.soft, lineHeight: "15px" }}>{r.company || "-"}</span>
      </span>
    </span>
  ) },
  { key: "source", header: "Source", width: 140, render: (r) => <span style={{ color: color.ink.mid }}>{r.source || "-"}</span> },
  { key: "owner", header: "Owner", width: 110, render: (r) => <span style={{ color: color.ink.mid }}>{r.owner || "-"}</span> },
  { key: "score", header: "Score", width: 130, render: (r) => <ScoreMeter score={r.score} /> },
  { key: "stage", header: "Stage", width: 140, render: (r) => <StagePill stage={r.stage} /> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: string) => boolean }[] = [
  { id: "new", title: "New leads", accent: color.status.info, match: (s) => s === "new" },
  { id: "working", title: "Working", accent: color.status.critical, match: (s) => s === "working" },
  { id: "qualified", title: "Qualified", accent: color.status.positive, match: (s) => s === "qualified" },
  { id: "unqualified", title: "Unqualified", accent: color.ink.soft, match: (s) => s === "unqualified" },
];

export function LeadsTable({ rows: all }: { rows: LeadRow[] }) {
  const [q, setQ] = React.useState("");
  const [owner, setOwner] = React.useState("all");

  const owners = React.useMemo(() => Array.from(new Set(all.map((r) => r.owner).filter(Boolean))) as string[], [all]);
  const kpis = React.useMemo(() => ({
    total: all.length,
    qualified: all.filter((r) => r.stage === "qualified").length,
    working: all.filter((r) => r.stage === "working").length,
    hot: all.filter((r) => r.score >= 75).length,
    avg: all.length ? Math.round(all.reduce((s, r) => s + r.score, 0) / all.length) : 0,
    owners: owners.length,
  }), [all, owners]);

  const rows = all
    .filter((r) => owner === "all" || r.owner === owner)
    .filter((r) => (r.name + r.company + r.source).toLowerCase().includes(q.toLowerCase()));
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.stage)) })).filter((x) => x.gr.length > 0);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Open leads" value={String(kpis.total)} note="in pipeline" noteTone={color.brand.primary} />
        <KPICard label="Qualified" value={String(kpis.qualified)} note="ready to convert" noteTone={color.status.positive} />
        <KPICard label="Working" value={String(kpis.working)} note="in progress" noteTone={color.status.critical} />
        <KPICard label="Hot (75+)" value={String(kpis.hot)} note="high score" noteTone={color.status.positive} />
        <KPICard label="Avg score" value={String(kpis.avg)} note="lead quality" noteTone={color.ink.soft} />
        <KPICard label="Owners" value={String(kpis.owners)} note="team coverage" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search lead, company, source…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
        {[["all", "All"] as [string, string], ...owners.map((o) => [o, o] as [string, string])].map(([id, lab]) => {
          const on = owner === id;
          return (
            <button key={id} onClick={() => setOwner(id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{all.filter((r) => r.owner === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No leads match your filters" hint="Try a different search or owner." action={<Button variant="primary" onClick={() => { setQ(""); setOwner("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 4 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/leads/${r.id}`} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
