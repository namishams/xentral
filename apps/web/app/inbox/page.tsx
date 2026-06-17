"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell } from "@xentral/ui";

type Msg = { from: "in" | "out"; text: string };
type Conv = { id: string; name: string; initials: string; preview: string; online?: boolean; unread?: boolean; thread: Msg[]; linked: string };

const CONVS: Conv[] = [
  { id: "alnoor", name: "Al Noor Real Estate", initials: "AN", preview: "Thanks, received 👍", online: true, unread: true, linked: "Invoice #1043 · AED 9,500", thread: [
    { from: "in", text: "Is invoice #1043 ready?" },
    { from: "out", text: "Yes — sent it just now, balance AED 9,500." },
    { from: "in", text: "Thanks, received 👍" },
  ] },
  { id: "gulf", name: "Gulf Trading", initials: "GT", preview: "Can you send the quote?", linked: "Deal · Office fit-out", thread: [
    { from: "in", text: "Can you send the quote?" },
    { from: "out", text: "On its way — give me 5 minutes." },
  ] },
  { id: "skyline", name: "Skyline", initials: "SK", preview: "Viewing booked ✓", linked: "Deal · Skyline Tower", thread: [
    { from: "out", text: "Your viewing is booked for Thursday 3pm." },
    { from: "in", text: "Viewing booked ✓" },
  ] },
];

export default function InboxPage() {
  const [activeId, setActiveId] = React.useState("alnoor");
  const [ctxOpen, setCtxOpen] = React.useState(true);
  const active = CONVS.find((c) => c.id === activeId)!;

  return (
    <AppShell active="inbox" fullBleed>
      <div style={{ height: "100%", display: "grid", gridTemplateColumns: ctxOpen ? "320px 1fr 280px" : "320px 1fr", background: color.surface.card }}>
        {/* Conversation list */}
        <aside style={{ borderRight: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            <div style={{ height: 30, border: `1px solid ${color.line.strong}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 6, padding: "0 10px", color: color.ink.soft, fontSize: 12 }}>⌕ Search conversations</div>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {CONVS.map((cv) => (
              <button key={cv.id} onClick={() => setActiveId(cv.id)} style={{ width: "100%", textAlign: "left", display: "flex", gap: 10, alignItems: "center", padding: 10, border: 0, borderBottom: `1px solid ${color.line.DEFAULT}`, background: cv.id === activeId ? color.surface.sunken : "#fff", cursor: "pointer" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: cv.id === activeId ? color.brand.primaryTint : color.surface.sunken, color: cv.id === activeId ? color.brand.primary : color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{cv.initials}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: cv.unread ? 600 : 500, color: color.ink.DEFAULT }}>{cv.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: color.ink.mid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.preview}</span>
                </span>
                {cv.online && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.status.positive, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </aside>

        {/* Active thread + composer */}
        <section style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>{active.initials}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{active.name}</div><div style={{ fontSize: 10.5, color: active.online ? color.status.positive : color.ink.soft }}>{active.online ? "online" : "last seen recently"}</div></div>
            <button onClick={() => setCtxOpen(!ctxOpen)} style={{ border: `1px solid ${color.line.strong}`, background: color.surface.card, borderRadius: 8, height: 28, padding: "0 10px", fontSize: 11.5, cursor: "pointer", color: color.ink.mid }}>{ctxOpen ? "Hide details" : "Details"}</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10, background: color.surface.page }}>
            {active.thread.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === "out" ? "flex-end" : "flex-start", maxWidth: "70%", fontSize: 12.5, padding: "8px 11px", borderRadius: 10, background: m.from === "out" ? color.brand.primaryTint : "#fff", color: m.from === "out" ? color.brand.primary : color.ink.DEFAULT, border: m.from === "out" ? "none" : `1px solid ${color.line.DEFAULT}` }}>{m.text}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: `1px solid ${color.line.DEFAULT}` }}>
            <span style={{ color: color.ink.soft, fontSize: 18 }}>📎</span>
            <div style={{ flex: 1, height: 32, border: `1px solid ${color.line.strong}`, borderRadius: 999, display: "flex", alignItems: "center", padding: "0 14px", color: color.ink.soft, fontSize: 12.5 }}>Message…</div>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: color.brand.primary, color: color.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>➤</span>
          </div>
        </section>

        {/* Context panel — collapsible */}
        {ctxOpen && (
          <aside style={{ borderLeft: `1px solid ${color.line.DEFAULT}`, padding: 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600 }}>{active.initials}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, marginTop: 4 }}>{active.name}</div>
              <div style={{ fontSize: 11, color: color.ink.mid }}>Customer</div>
            </div>
            <div style={{ fontSize: 11.5, background: color.surface.sunken, borderRadius: 8, padding: 9, color: color.ink.DEFAULT }}>🔗 {active.linked}</div>
            <div style={{ fontSize: 11.5, background: color.surface.sunken, borderRadius: 8, padding: 9, color: color.ink.DEFAULT }}>🗒 Notes & previous chats</div>
            <div style={{ marginTop: "auto", fontSize: 10, color: color.ink.soft }}>Tool archetype · context 280px · collapsible</div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
