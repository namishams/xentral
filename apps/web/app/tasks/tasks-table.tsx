"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { KPICard, Input, Button, StatusBadge, EmptyState, type BadgeTone } from "@xentral/ui";
import type { TaskRow, TaskPriority } from "@xentral/module-crm";

/* Faithful port of the live app's Tasks board: KPI band -> priority + owner chips ->
 * checkable rows grouped Open / Done, with due-date tones. Local completion toggles persist
 * in the browser (survives reload). DataPort rows, tokens only. */

const LS_KEY = "xentral-tasks-done";
const PRIO_TONE: Record<TaskPriority, BadgeTone> = { high: "critical", medium: "warning", low: "neutral" };
const DAY = 86400000;

function loadDone(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function saveDone(m: Record<string, boolean>) { try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch {} }

const fmtDue = (s: string) => { const d = new Date(s); return isNaN(+d) ? (s || "—") : d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }); };
function dueTone(s: string, done: boolean): string {
  if (done || !s) return color.ink.soft;
  const days = Math.floor((+new Date(s) - Date.now()) / DAY);
  if (days < 0) return color.status.negative;
  if (days <= 2) return color.status.critical;
  return color.ink.mid;
}
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Row({ r, done, onToggle }: { r: TaskRow; done: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
      <button onClick={onToggle} aria-label={done ? "Mark not done" : "Mark done"} style={{ width: 20, height: 20, borderRadius: 6, cursor: "pointer", flexShrink: 0,
        border: `1.5px solid ${done ? color.status.positive : color.line.strong}`, background: done ? color.status.positive : color.surface.card, color: color.ink.onPrimary, fontSize: 12, lineHeight: "16px" }}>{done ? "✓" : ""}</button>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, color: done ? color.ink.soft : color.ink.DEFAULT, textDecoration: done ? "line-through" : "none" }}>{r.title}</span>
      <StatusBadge tone={PRIO_TONE[r.priority]} label={r.priority} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: dueTone(r.due, done), minWidth: 64, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtDue(r.due)}</span>
      {r.owner ? <span aria-hidden="true" title={r.owner} style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, fontSize: 10.5, fontWeight: 700, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(r.owner)}</span> : null}
    </div>
  );
}

export function TasksTable({ rows: all }: { rows: TaskRow[] }) {
  const [q, setQ] = React.useState("");
  const [prio, setPrio] = React.useState("all");
  const [owner, setOwner] = React.useState("all");
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => { setDone(loadDone()); }, []);
  const isDone = (r: TaskRow) => done[r.id] ?? r.done;
  const toggle = (r: TaskRow) => { const next = { ...done, [r.id]: !isDone(r) }; setDone(next); saveDone(next); };

  const owners = React.useMemo(() => Array.from(new Set(all.map((r) => r.owner).filter(Boolean))) as string[], [all]);
  const kpis = React.useMemo(() => {
    const open = all.filter((r) => !isDone(r));
    return {
      open: open.length,
      done: all.length - open.length,
      high: open.filter((r) => r.priority === "high").length,
      dueSoon: open.filter((r) => r.due && Math.floor((+new Date(r.due) - Date.now()) / DAY) >= 0 && Math.floor((+new Date(r.due) - Date.now()) / DAY) <= 2).length,
      overdue: open.filter((r) => r.due && +new Date(r.due) < Date.now()).length,
      owners: owners.length,
    };
  }, [all, done, owners]);

  const filtered = all
    .filter((r) => prio === "all" || r.priority === prio)
    .filter((r) => owner === "all" || r.owner === owner)
    .filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  const openRows = filtered.filter((r) => !isDone(r)).sort((a, b) => (+new Date(a.due || 0)) - (+new Date(b.due || 0)));
  const doneRows = filtered.filter((r) => isDone(r));

  const chip = (id: string, lab: string, on: boolean, set: () => void, count?: number) => (
    <button key={id} onClick={set} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
      border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
      {lab}{count != null ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{count}</span> : null}
    </button>
  );

  const Group = ({ title, accent, rows }: { title: string; accent: string; rows: TaskRow[] }) => rows.length === 0 ? null : (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 3, height: 16, borderRadius: 2, background: accent }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: accent }}>{title}</span>
        <span style={{ fontSize: 12, color: color.ink.soft }}>{rows.length}</span>
      </div>
      <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
        {rows.map((r) => <Row key={r.id} r={r} done={isDone(r)} onToggle={() => toggle(r)} />)}
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Open" value={String(kpis.open)} note="to do" noteTone={color.brand.primary} />
        <KPICard label="Completed" value={String(kpis.done)} note="done" noteTone={color.status.positive} />
        <KPICard label="High priority" value={String(kpis.high)} note="urgent" noteTone={color.status.negative} />
        <KPICard label="Due soon" value={String(kpis.dueSoon)} note="next 48h" noteTone={color.status.critical} />
        <KPICard label="Overdue" value={String(kpis.overdue)} note="past due" noteTone={color.status.negative} />
        <KPICard label="Owners" value={String(kpis.owners)} note="team coverage" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {chip("all", "All priorities", prio === "all", () => setPrio("all"))}
        {(["high", "medium", "low"] as TaskPriority[]).map((p) => chip(p, p.charAt(0).toUpperCase() + p.slice(1), prio === p, () => setPrio(prio === p ? "all" : p), all.filter((r) => r.priority === p).length))}
        <span style={{ width: 1, background: color.line.DEFAULT, margin: "0 3px" }} />
        {chip("all-o", "All owners", owner === "all", () => setOwner("all"))}
        {owners.map((o) => chip(o, o, owner === o, () => setOwner(owner === o ? "all" : o), all.filter((r) => r.owner === o).length))}
      </div>

      {openRows.length === 0 && doneRows.length === 0 ? (
        <EmptyState title="No tasks match your filters" hint="Try a different search, priority or owner." action={<Button variant="primary" onClick={() => { setQ(""); setPrio("all"); setOwner("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Group title="Open" accent={color.status.info} rows={openRows} />
          <Group title="Completed" accent={color.status.positive} rows={doneRows} />
        </div>
      )}
    </>
  );
}
