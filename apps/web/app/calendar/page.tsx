"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button } from "@xentral/ui";

type Event = { id: string; time: string; title: string; about: string; kind: "meeting" | "call" | "task" | "deadline" };
type Day = { id: string; label: string; date: string; today?: boolean; events: Event[] };

const KIND: Record<Event["kind"], string> = { meeting: color.status.info, call: color.status.critical, task: color.brand.primary, deadline: color.status.negative };

const DAYS: Day[] = [
  { id: "d1", label: "Today", date: "Wed, 17 Jun", today: true, events: [
    { id: "e1", time: "12:00", title: "Confirm Skyline site visit", about: "Follow-up · Aisha Rahman", kind: "task" },
    { id: "e2", time: "15:00", title: "Fit-out walkthrough", about: "On-site · Skyline Tower", kind: "meeting" },
    { id: "e3", time: "17:30", title: "Quote review Q-3009", about: "Video · Gulf Trading", kind: "meeting" },
  ] },
  { id: "d2", label: "Thursday", date: "Thu, 18 Jun", events: [
    { id: "e4", time: "11:00", title: "Villa portfolio pitch", about: "Video · Damac", kind: "meeting" },
    { id: "e5", time: "14:00", title: "Callback — Paula", about: "Call · Gulf Trading", kind: "call" },
  ] },
  { id: "d3", label: "Friday", date: "Fri, 19 Jun", events: [
    { id: "e6", time: "10:00", title: "Reorder call", about: "Call · Al Noor", kind: "call" },
    { id: "e7", time: "EOD", title: "VAT 201 draft due", about: "Deadline · Finance", kind: "deadline" },
  ] },
];

export default function CalendarPage() {
  return (
    <AppShell active="calendar">
      <PageTitleRow title="Calendar" subtitle="Agenda · this week" actions={<Button variant="primary">+ New event</Button>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {DAYS.map((d) => (
          <div key={d.id}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: d.today ? color.brand.primary : color.ink.DEFAULT }}>{d.label}</span>
              <span style={{ fontSize: 12, color: color.ink.soft }}>{d.date}</span>
              {d.today ? <span style={{ fontSize: 11, fontWeight: 600, background: color.brand.primaryTint, color: color.brand.primary, borderRadius: 999, padding: "1px 8px" }}>now</span> : null}
            </div>
            <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, overflow: "hidden" }}>
              {d.events.map((e, i) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${color.line.DEFAULT}` }}>
                  <span style={{ width: 52, flexShrink: 0, fontSize: 13, fontWeight: 600, color: color.ink.mid }}>{e.time}</span>
                  <span style={{ width: 4, height: 30, borderRadius: 2, background: KIND[e.kind], flexShrink: 0 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{e.title}</span>
                    <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{e.about}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Agenda calendar · locked AppShell + tokens only</p>
    </AppShell>
  );
}
