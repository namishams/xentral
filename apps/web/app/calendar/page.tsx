"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, KPICard, EmptyState } from "@xentral/ui";

type Meeting = { id: string; title: string; description: string | null; startsAt: string; endsAt: string; allDay: boolean; location: string | null; meetingUrl: string | null; type: string; status: string };

const KIND: Record<string, string> = { meeting: color.status.info, call: color.status.critical, task: color.brand.primary, deadline: color.status.negative };
const kindColor = (t: string) => KIND[t] ?? color.brand.primary;
const timeOf = (s: string) => { const d = new Date(s); return isNaN(+d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
const dayKey = (s: string) => { const d = new Date(s); return isNaN(+d) ? "?" : d.toISOString().slice(0, 10); };
const dayLabel = (key: string) => {
  const d = new Date(key + "T00:00:00"); const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((+d - +today) / 86400000);
  const rel = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : "";
  return { rel, date: d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" }), today: diff === 0 };
};

export default function CalendarPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/calendar/meetings").then((r) => r.json()).then((d) => { setMeetings(d.meetings ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) { const k = dayKey(m.startsAt); if (!map.has(k)) map.set(k, []); map.get(k)!.push(m); }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [meetings]);

  const now = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);
  const kpis = {
    total: meetings.length,
    today: meetings.filter((m) => dayKey(m.startsAt) === todayKey).length,
    upcoming: meetings.filter((m) => +new Date(m.startsAt) >= now).length,
    calls: meetings.filter((m) => m.type === "call").length,
  };

  return (
    <AppShell active="calendar">
      <PageTitleRow title="Calendar" subtitle={`${meetings.length} meetings · next 60 days`} actions={<Button variant="primary">+ New meeting</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 18 }}>
        <KPICard label="Meetings" value={String(kpis.total)} note="scheduled" noteTone={color.brand.primary} />
        <KPICard label="Today" value={String(kpis.today)} note="on your agenda" noteTone={color.status.info} />
        <KPICard label="Upcoming" value={String(kpis.upcoming)} note="still ahead" noteTone={color.status.positive} />
        <KPICard label="Calls" value={String(kpis.calls)} note="scheduled calls" noteTone={color.ink.soft} />
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
      ) : groups.length === 0 ? (
        <EmptyState title="No meetings scheduled" hint="New meetings, calls and tasks will appear here." action={<Button variant="primary">+ New meeting</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groups.map(([key, items]) => {
            const lab = dayLabel(key);
            return (
              <div key={key}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: lab.today ? color.brand.primary : color.ink.DEFAULT }}>{lab.rel || lab.date}</span>
                  {lab.rel ? <span style={{ fontSize: 12.5, color: color.ink.soft }}>{lab.date}</span> : null}
                  <span style={{ fontSize: 12, color: color.ink.soft }}>· {items.length}</span>
                </div>
                <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
                  {items.map((m) => (
                    <div key={m.id} style={{ display: "flex", gap: 12, padding: "11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, alignItems: "center" }}>
                      <span style={{ width: 56, fontSize: 12.5, fontWeight: 600, color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{m.allDay ? "All day" : timeOf(m.startsAt)}</span>
                      <span style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: kindColor(m.type) }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 600, fontSize: 13.5, color: color.ink.DEFAULT }}>{m.title}</span>
                        <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{[m.type, m.location, m.meetingUrl ? "Video" : null].filter(Boolean).join(" · ") || "—"}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: kindColor(m.type), background: `color-mix(in srgb, ${kindColor(m.type)} 12%, ${color.surface.card})`, borderRadius: 6, padding: "2px 8px", textTransform: "capitalize" }}>{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Calendar · live meetings via DataPort (seed-free) · tenant-scoped · tokens-only</p>
    </AppShell>
  );
}
