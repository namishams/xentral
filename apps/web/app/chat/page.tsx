"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell } from "@xentral/ui";

type Msg = { who: string; initials: string; text: string; time: string; self?: boolean };
type Channel = { id: string; name: string; kind: "channel" | "dm"; preview: string; unread?: number; thread: Msg[] };

const CHANNELS: Channel[] = [
  { id: "sales", name: "sales", kind: "channel", preview: "Sara: closed Brokerage retainer 🎉", unread: 3, thread: [
    { who: "Sara Khan", initials: "SK", text: "Closed the Brokerage retainer — AED 90k 🎉", time: "09:31" },
    { who: "Nami", initials: "N", text: "Massive, well done!", time: "09:32", self: true },
    { who: "Omar", initials: "OH", text: "Adding it to the forecast now.", time: "09:35" },
  ] },
  { id: "support", name: "support", kind: "channel", preview: "New WhatsApp lead from Bright Interiors", thread: [
    { who: "system", initials: "✦", text: "New qualified lead: Bright Interiors (score 82) via WhatsApp.", time: "08:10" },
    { who: "Lena", initials: "LF", text: "I'll take it.", time: "08:12" },
  ] },
  { id: "general", name: "general", kind: "channel", preview: "Standup at 10:00", thread: [
    { who: "Nami", initials: "N", text: "Standup at 10:00, link in calendar.", time: "Yesterday", self: true },
  ] },
  { id: "dm-omar", name: "Omar Haddad", kind: "dm", preview: "Sent the villa quote", thread: [
    { who: "Omar", initials: "OH", text: "Sent the villa portfolio quote to Damac.", time: "11:02" },
  ] },
];

export default function ChatPage() {
  const [activeId, setActiveId] = React.useState("sales");
  const active = CHANNELS.find((c) => c.id === activeId)!;

  return (
    <AppShell active="chat" fullBleed>
      <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
        <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>Team chat</div>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "8px 0" }}>
            {CHANNELS.map((c) => {
              const on = c.id === activeId;
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", border: "none", background: on ? color.brand.primaryTint : "transparent", padding: "9px 16px", cursor: "pointer", alignItems: "center" }}>
                  <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: c.kind === "dm" ? "50%" : 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.kind === "channel" ? "#" : c.name.split(" ").map((w) => w[0]).join("")}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: on ? color.brand.primary : color.ink.DEFAULT }}>{c.kind === "channel" ? "#" + c.name : c.name}</span>
                    <span style={{ display: "block", fontSize: 12, color: color.ink.soft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.preview}</span>
                  </span>
                  {c.unread ? <span style={{ flexShrink: 0, minWidth: 18, height: 18, borderRadius: 9, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{c.unread}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, background: color.surface.page }}>
          <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 24px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>{active.kind === "channel" ? "#" + active.name : active.name}</div>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {active.thread.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: "50%", background: m.who === "system" ? color.brand.primaryTint : color.surface.sunken, color: m.who === "system" ? color.brand.primary : color.ink.mid, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.initials}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: m.self ? color.brand.primary : color.ink.DEFAULT }}>{m.who}</span>
                    <span style={{ fontSize: 11, color: color.ink.soft }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: "21px", color: color.ink.DEFAULT, marginTop: 2 }}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flexShrink: 0, background: color.surface.card, borderTop: `1px solid ${color.line.DEFAULT}`, padding: "12px 24px", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, height: 40, border: `1px solid ${color.line.strong}`, borderRadius: 10, display: "flex", alignItems: "center", padding: "0 14px", color: color.ink.soft, fontSize: 13 }}>Message {active.kind === "channel" ? "#" + active.name : active.name}…</div>
            <button style={{ height: 40, padding: "0 18px", borderRadius: 10, background: color.brand.primary, color: color.ink.onPrimary, border: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
