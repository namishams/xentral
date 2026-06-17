"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, KPICard } from "@xentral/ui";

type Meeting = { id: string; title: string; description: string | null; startsAt: string; endsAt: string; allDay: boolean; location: string | null; meetingUrl: string | null; type: string; status: string };

const TYPES = [
  { id: "meeting", label: "Meeting", c: color.status.info },
  { id: "call", label: "Call", c: color.brand.primary },
  { id: "demo", label: "Demo", c: "#6b3fd4" },
  { id: "deadline", label: "Deadline", c: color.status.critical },
  { id: "task", label: "Task", c: color.status.positive },
];
const typeColor = (t: string) => TYPES.find((x) => x.id === t)?.c ?? color.brand.primary;
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const timeOf = (s: string) => { const d = new Date(s); return isNaN(+d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Draft = { id?: string; title: string; type: string; date: string; start: string; end: string; allDay: boolean; location: string; meetingUrl: string; description: string };
const blankDraft = (date: string): Draft => ({ title: "", type: "meeting", date, start: "09:00", end: "10:00", allDay: false, location: "", meetingUrl: "", description: "" });

export default function CalendarPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cursor, setCursor] = React.useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [view, setView] = React.useState<"month" | "agenda">("month");
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toISOString();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0).toISOString();
    setLoading(true);
    fetch(`/api/calendar/meetings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => r.json()).then((d) => { setMeetings(d.meetings ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [cursor]);
  React.useEffect(() => { load(); }, [load]);

  const grid = React.useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDow = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(1 - startDow);
    const cells: Date[] = [];
    for (let k = 0; k < 42; k++) { const d = new Date(start); d.setDate(start.getDate() + k); cells.push(d); }
    return cells;
  }, [cursor]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) { const k = ymd(new Date(m.startsAt)); if (!map.has(k)) map.set(k, []); map.get(k)!.push(m); }
    for (const arr of map.values()) arr.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return map;
  }, [meetings]);

  const todayKey = ymd(new Date());
  const now = Date.now();
  const monthMeetings = meetings.filter((m) => new Date(m.startsAt).getMonth() === cursor.getMonth() && new Date(m.startsAt).getFullYear() === cursor.getFullYear());
  const kpis = { month: monthMeetings.length, today: (byDay.get(todayKey) ?? []).length, upcoming: meetings.filter((m) => +new Date(m.startsAt) >= now).length, calls: monthMeetings.filter((m) => m.type === "call").length };

  function openNew(dateKey: string) { setDraft(blankDraft(dateKey)); }
  function openEdit(m: Meeting) {
    const s = new Date(m.startsAt), e = new Date(m.endsAt);
    setDraft({ id: m.id, title: m.title, type: m.type, date: ymd(s), start: hm(s), end: hm(e), allDay: m.allDay, location: m.location ?? "", meetingUrl: m.meetingUrl ?? "", description: m.description ?? "" });
  }
  async function save() {
    if (!draft || !draft.title.trim()) return;
    setSaving(true);
    const startsAt = new Date(`${draft.date}T${draft.allDay ? "00:00" : draft.start}`).toISOString();
    const endsAt = new Date(`${draft.date}T${draft.allDay ? "23:59" : draft.end}`).toISOString();
    const payload = { title: draft.title.trim(), type: draft.type, startsAt, endsAt, allDay: draft.allDay, location: draft.location, meetingUrl: draft.meetingUrl, description: draft.description };
    try {
      const res = await fetch(draft.id ? `/api/calendar/meetings/${draft.id}` : "/api/calendar/meetings", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setDraft(null); load(); } else { const j = await res.json().catch(() => ({})); alert(j.error || "Could not save"); }
    } finally { setSaving(false); }
  }
  async function remove() {
    if (!draft?.id) return;
    if (!confirm("Delete this meeting?")) return;
    setSaving(true);
    try { const res = await fetch(`/api/calendar/meetings/${draft.id}`, { method: "DELETE" }); if (res.ok) { setDraft(null); load(); } } finally { setSaving(false); }
  }

  const navBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, cursor: "pointer", fontSize: 15 };

  return (
    <AppShell active="calendar">
      <PageTitleRow title="Calendar" subtitle="Meetings, calls and deadlines for your workspace"
        actions={<Button variant="primary" onClick={() => openNew(todayKey)}>+ New meeting</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        <KPICard label="This month" value={String(kpis.month)} note="scheduled" noteTone={color.brand.primary} />
        <KPICard label="Today" value={String(kpis.today)} note="on the agenda" noteTone={color.status.info} />
        <KPICard label="Upcoming" value={String(kpis.upcoming)} note="ahead" noteTone={color.status.positive} />
        <KPICard label="Calls" value={String(kpis.calls)} note="this month" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button aria-label="Previous month" style={navBtn} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, minWidth: 170, textAlign: "center" }}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</div>
          <button aria-label="Next month" style={navBtn} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
          <Button onClick={() => setCursor(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })}>Today</Button>
        </div>
        <div style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden" }}>
          {(["month", "agenda"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 600, border: 0, cursor: "pointer", background: view === v ? color.ink.DEFAULT : color.surface.card, color: view === v ? color.surface.card : color.ink.mid, textTransform: "capitalize" }}>{v}</button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", background: color.surface.card }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            {WEEK.map((w) => <div key={w} style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase", textAlign: "left" }}>{w}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(104px, 1fr)" }}>
            {grid.map((d, idx) => {
              const key = ymd(d); const inMonth = d.getMonth() === cursor.getMonth(); const isToday = key === todayKey;
              const evs = byDay.get(key) ?? [];
              return (
                <div key={idx} onClick={() => openNew(key)} style={{ borderRight: (idx % 7 !== 6) ? `1px solid ${color.line.DEFAULT}` : "none", borderBottom: idx < 35 ? `1px solid ${color.line.DEFAULT}` : "none", padding: 6, minHeight: 104, background: inMonth ? color.surface.card : color.surface.sunken, cursor: "pointer", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: isToday ? color.brand.primary : "transparent", color: isToday ? color.ink.onPrimary : inMonth ? color.ink.mid : color.ink.soft }}>{d.getDate()}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                    {evs.slice(0, 3).map((m) => (
                      <button key={m.id} onClick={(e) => { e.stopPropagation(); openEdit(m); }} title={m.title}
                        style={{ textAlign: "left", border: 0, borderRadius: 5, padding: "2px 6px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: `color-mix(in srgb, ${typeColor(m.type)} 15%, ${color.surface.card})`, color: typeColor(m.type), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {!m.allDay ? <span style={{ fontWeight: 700, marginRight: 4 }}>{timeOf(m.startsAt)}</span> : null}{m.title}
                      </button>
                    ))}
                    {evs.length > 3 ? <span style={{ fontSize: 10.5, color: color.ink.soft, paddingLeft: 4 }}>+{evs.length - 3} more</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", background: color.surface.card }}>
          {(() => {
            const future = meetings.filter((m) => +new Date(m.endsAt) >= now - 86400000).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
            if (future.length === 0) return <div style={{ padding: 28, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>{loading ? "Loading…" : "No upcoming meetings. Click a day to add one."}</div>;
            const groups = new Map<string, Meeting[]>();
            for (const m of future) { const k = ymd(new Date(m.startsAt)); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(m); }
            return Array.from(groups.entries()).map(([k, arr]) => (
              <div key={k} style={{ borderTop: `1px solid ${color.line.DEFAULT}` }}>
                <div style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, color: k === todayKey ? color.brand.primary : color.ink.mid, background: color.surface.sunken }}>{new Date(k + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long" })}{k === todayKey ? " · Today" : ""}</div>
                {arr.map((m) => (
                  <button key={m.id} onClick={() => openEdit(m)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", border: 0, borderTop: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, cursor: "pointer" }}>
                    <span style={{ width: 4, height: 30, borderRadius: 3, background: typeColor(m.type) }} />
                    <span style={{ width: 110, fontSize: 12.5, color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{m.allDay ? "All day" : `${timeOf(m.startsAt)} – ${timeOf(m.endsAt)}`}</span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{m.title}</span>
                    {m.location ? <span style={{ fontSize: 12, color: color.ink.soft }}>{m.location}</span> : null}
                  </button>
                ))}
              </div>
            ));
          })()}
        </div>
      )}

      {draft ? (
        <div onClick={() => !saving && setDraft(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>{draft.id ? "Edit meeting" : "New meeting"}</h2>
              <button aria-label="Close" onClick={() => setDraft(null)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            <label style={lbl}>Title</label>
            <input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Meeting title" style={inp} />
            <label style={lbl}>Type</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {TYPES.map((t) => { const on = draft.type === t.id; return <button key={t.id} onClick={() => setDraft({ ...draft, type: t.id })} style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? t.c : color.line.strong}`, background: on ? `color-mix(in srgb, ${t.c} 14%, ${color.surface.card})` : color.surface.card, color: on ? t.c : color.ink.mid }}>{t.label}</button>; })}
            </div>
            <label style={lbl}>Date</label>
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} style={inp} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: color.ink.mid, margin: "2px 0 12px", cursor: "pointer" }}>
              <input type="checkbox" checked={draft.allDay} onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })} /> All day
            </label>
            {!draft.allDay ? (
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}><label style={lbl}>Start</label><input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} style={inp} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>End</label><input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} style={inp} /></div>
              </div>
            ) : null}
            <label style={lbl}>Location</label>
            <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Office, Zoom, Google Meet…" style={inp} />
            <label style={lbl}>Meeting URL</label>
            <input value={draft.meetingUrl} onChange={(e) => setDraft({ ...draft, meetingUrl: e.target.value })} placeholder="https://…" style={inp} />
            <label style={lbl}>Notes</label>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} style={{ ...inp, height: "auto", padding: 11, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              {draft.id ? <Button onClick={remove} disabled={saving}>Delete</Button> : <span />}
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => setDraft(null)} disabled={saving}>Cancel</Button>
                <Button variant="primary" onClick={save} disabled={saving || !draft.title.trim()}>{saving ? "Saving…" : draft.id ? "Save changes" : "Create"}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Calendar · live via API · tenant-scoped · create &amp; edit meetings</p>
    </AppShell>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 38, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", marginBottom: 12 };
