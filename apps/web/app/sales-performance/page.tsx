"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, DataTable, Panel, PanelHeader, PanelBody, EmptyState, type Column } from "@xentral/ui";

type Rep = { id: string; name: string | null; email: string | null; teamId: string | null; teamName: string | null; salesRole: string | null; pipeline: number; won: number; wonCount: number; lostCount: number; openCount: number };
type Team = { id: string; name: string };

const N = (v: unknown) => Number(v) || 0;
const aed = (n: number) => `AED ${N(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const aedShort = (n: number) => { n = N(n); return n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`; };
const initials = (n: string) => (n || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const winRate = (w: number, l: number) => w + l > 0 ? Math.round((w / (w + l)) * 100) : 0;

export default function SalesPerformancePage() {
  const [reps, setReps] = React.useState<Rep[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [team, setTeam] = React.useState("all");

  React.useEffect(() => { fetch("/api/crm/sales-performance").then((r) => r.json()).then((j) => { setReps(j.reps ?? []); setTeams(j.teams ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const shown = team === "all" ? reps : team === "none" ? reps.filter((r) => !r.teamId) : reps.filter((r) => r.teamId === team);
  const pipeline = shown.reduce((s, r) => s + r.pipeline, 0);
  const won = shown.reduce((s, r) => s + r.won, 0);
  const wonC = shown.reduce((s, r) => s + r.wonCount, 0);
  const lostC = shown.reduce((s, r) => s + r.lostCount, 0);
  const activeReps = shown.filter((r) => r.pipeline > 0 || r.wonCount > 0 || r.openCount > 0).length;

  // team rollup
  const rollup = teams.map((t) => {
    const rs = reps.filter((r) => r.teamId === t.id);
    return { id: t.id, name: t.name, pipeline: rs.reduce((s, r) => s + r.pipeline, 0), won: rs.reduce((s, r) => s + r.won, 0), reps: rs.length, wc: rs.reduce((s, r) => s + r.wonCount, 0), lc: rs.reduce((s, r) => s + r.lostCount, 0) };
  }).sort((a, b) => b.won - a.won);
  const topWon = Math.max(1, ...shown.map((r) => r.won));

  const FILTERS = [{ id: "all", label: "All reps" }, ...teams.map((t) => ({ id: t.id, label: t.name })), { id: "none", label: "Unassigned" }];

  const COLS: Column<Rep>[] = [
    { key: "name", header: "Rep", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}><span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials(r.name || "?")}</span><span style={{ minWidth: 0 }}><span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name || r.email}{r.salesRole === "MANAGER" ? <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 700, color: color.brand.primary }}>MGR</span> : null}</span><span style={{ fontSize: 11, color: color.ink.soft }}>{r.teamName || "Unassigned"}</span></span></span>, sort: (r) => (r.name || "").toLowerCase(), filterText: (r) => `${r.name || ""} ${r.teamName || ""}` },
    { key: "openCount", header: "Open", width: 130, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.openCount} · {aedShort(r.pipeline)}</span>, sort: (r) => r.pipeline },
    { key: "won", header: "Won", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600, color: r.won > 0 ? color.status.positive : color.ink.soft, fontVariantNumeric: "tabular-nums" }}>{r.won > 0 ? aed(r.won) : "—"}</span>, sort: (r) => r.won },
    { key: "win", header: "Win rate", width: 100, align: "right", render: (r) => { const wr = winRate(r.wonCount, r.lostCount); return <span style={{ fontWeight: 600, color: wr >= 50 ? color.status.positive : wr > 0 ? color.ink.mid : color.ink.soft }}>{r.wonCount + r.lostCount > 0 ? `${wr}%` : "—"}</span>; }, sort: (r) => winRate(r.wonCount, r.lostCount) },
  ];

  return (
    <AppShell active="sales-performance">
      <PageTitleRow title="Sales Performance" subtitle={`${shown.length} rep${shown.length === 1 ? "" : "s"}${team !== "all" ? " · " + (FILTERS.find((f) => f.id === team)?.label ?? "") : ""}`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Open pipeline" value={aedShort(pipeline)} note="weighted by reps" noteTone={color.brand.primary} />
        <KPICard label="Won" value={aedShort(won)} note={`${wonC} deals`} noteTone={color.status.positive} />
        <KPICard label="Win rate" value={`${winRate(wonC, lostC)}%`} note={`${wonC} won · ${lostC} lost`} noteTone={winRate(wonC, lostC) >= 50 ? color.status.positive : color.status.critical} />
        <KPICard label="Active reps" value={String(activeReps)} note={`of ${shown.length}`} noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {FILTERS.map((f) => { const on = team === f.id; return <button key={f.id} onClick={() => setTeam(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>{f.label}</button>; })}
          </div>
          {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
            : shown.length === 0 ? <EmptyState title="No reps" hint="Assign reps to teams under Sales Teams." />
              : <DataTable<Rep> columns={COLS} rows={shown} getKey={(r) => r.id} searchable searchPlaceholder="Search rep or team…" title="Leaderboard" initialSort={{ key: "won", dir: "desc" }} maxHeight={620} />}
        </div>

        <Panel>
          <PanelHeader title="By team" subtitle="Won this period" />
          <PanelBody flush>
            {rollup.length === 0 ? <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>No teams yet. <a href="/sales-teams" style={{ color: color.brand.primary }}>Create one →</a></div>
              : rollup.map((t) => (
                <button key={t.id} onClick={() => setTeam(t.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: "transparent", border: 0, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{t.name} <span style={{ fontSize: 11, color: color.ink.soft, fontWeight: 400 }}>· {t.reps}</span></span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: color.status.positive, fontVariantNumeric: "tabular-nums" }}>{t.won > 0 ? aedShort(t.won) : "—"}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: color.surface.sunken, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (t.won / topWon) * 100)}%`, background: color.status.positive, borderRadius: 4 }} /></div>
                  <div style={{ fontSize: 11, color: color.ink.soft, marginTop: 4 }}>{aedShort(t.pipeline)} pipeline · {winRate(t.wc, t.lc)}% win</div>
                </button>
              ))}
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}
