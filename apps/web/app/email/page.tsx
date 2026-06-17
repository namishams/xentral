"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell } from "@xentral/ui";

type Mail = {
  id: string;
  from: string;
  initials: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread?: boolean;
  linked?: string;
};

const MAILS: Mail[] = [
  { id: "m1", from: "Paula Lenz · Gulf Trading", initials: "PL", subject: "Re: Quotation Q-3009", preview: "Looks good — can we start next week?", time: "09:42", unread: true, linked: "Deal · Office relocation", body: [
    "Hi Nami,", "Thanks for the quote Q-3009 — the scope looks right. Can we start next week?", "Also, please add 2 extra workstations to the BOQ.", "Best, Paula" ] },
  { id: "m2", from: "Aisha Rahman · Skyline", initials: "AR", subject: "Site visit — Thursday", preview: "Confirming the 3pm slot for the fit-out walkthrough.", time: "08:15", linked: "Deal · Skyline Tower fit-out", body: [
    "Morning,", "Confirming the 3pm slot on Thursday for the fit-out walkthrough.", "Parking is at gate B.", "Aisha" ] },
  { id: "m3", from: "accounts@damac.ae", initials: "DA", subject: "Payment confirmation — INV-1040", preview: "We have processed AED 9,900 against invoice 1040.", time: "Yesterday", linked: "Invoice · INV-1040", body: [
    "Dear supplier,", "We have processed AED 9,900 against invoice INV-1040. Remittance attached.", "Damac Accounts Payable" ] },
  { id: "m4", from: "Lena Fischer · Al Noor", initials: "LF", subject: "Brochure pack reorder", preview: "Could we reorder 100 brochure packs?", time: "Yesterday", body: [
    "Hi,", "Could we reorder 100 brochure packs (BRO-PACK)? Same spec as last time.", "Thanks, Lena" ] },
];

export default function EmailPage() {
  const [activeId, setActiveId] = React.useState("m1");
  const active = MAILS.find((m) => m.id === activeId)!;

  return (
    <AppShell active="email" fullBleed>
      <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
        {/* List pane */}
        <div style={{ width: 340, flexShrink: 0, borderRight: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", minHeight: 0, background: color.surface.card }}>
          <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT }}>Inbox</span>
            <span style={{ fontSize: 12, color: color.ink.soft }}>{MAILS.filter((m) => m.unread).length} unread</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {MAILS.map((m) => {
              const on = m.id === activeId;
              return (
                <button key={m.id} onClick={() => setActiveId(m.id)} style={{ display: "flex", gap: 12, width: "100%", textAlign: "left", border: "none", borderBottom: `1px solid ${color.line.DEFAULT}`, background: on ? color.brand.primaryTint : "#fff", padding: "12px 16px", cursor: "pointer" }}>
                  <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.initials}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: m.unread ? 700 : 600, color: color.ink.DEFAULT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</span>
                      <span style={{ fontSize: 11, color: color.ink.soft, flexShrink: 0 }}>{m.time}</span>
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: m.unread ? 600 : 500, color: color.ink.DEFAULT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</span>
                    <span style={{ display: "block", fontSize: 12, color: color.ink.soft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.preview}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading pane */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, background: color.surface.page }}>
          <div style={{ flexShrink: 0, background: color.surface.card, borderBottom: `1px solid ${color.line.DEFAULT}`, padding: "16px 24px" }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: color.ink.DEFAULT }}>{active.subject}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 13, color: color.ink.mid }}>{active.from}</span>
              {active.linked ? <span style={{ fontSize: 11, fontWeight: 600, background: color.brand.primaryTint, color: color.brand.primary, borderRadius: 999, padding: "2px 10px" }}>↗ {active.linked}</span> : null}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "20px 24px" }}>
            <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "18px 20px", maxWidth: 720 }}>
              {active.body.map((p, i) => <p key={i} style={{ fontSize: 14, lineHeight: "22px", color: color.ink.DEFAULT, margin: i === 0 ? 0 : "12px 0 0" }}>{p}</p>)}
            </div>
          </div>
          <div style={{ flexShrink: 0, background: color.surface.card, borderTop: `1px solid ${color.line.DEFAULT}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 40, border: `1px solid ${color.line.strong}`, borderRadius: 10, display: "flex", alignItems: "center", padding: "0 14px", color: color.ink.soft, fontSize: 13 }}>Reply to {active.initials}…</div>
            <button style={{ height: 40, padding: "0 18px", borderRadius: 10, background: color.brand.primary, color: "#fff", border: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
            <button style={{ height: 40, padding: "0 14px", borderRadius: 10, background: color.surface.card, border: `1px solid ${color.line.strong}`, color: color.ink.DEFAULT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✦ AI reply</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
