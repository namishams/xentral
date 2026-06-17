"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell } from "@xentral/ui";

type Turn = { who: "you" | "ai"; text: string; action?: { label: string; detail: string } };

const SEED: Turn[] = [
  { who: "you", text: "Who's overdue and what do they owe?" },
  { who: "ai", text: "Two customers are overdue. Al Noor Real Estate owes AED 9,500 (INV-1043, 0 days) and a bill from Shenzhen Locks is 7 days overdue (AED 8,400).", action: { label: "Open receivables", detail: "2 invoices · AED 9,500 owed to you" } },
  { who: "you", text: "Draft an invoice for Gulf Trading for the office relocation." },
  { who: "ai", text: "Done — I drafted INV-1044 for Gulf Trading from deal “Office relocation”, AED 12,000 + 5% VAT. It's a draft, nothing was sent.", action: { label: "Review draft INV-1044", detail: "AED 12,600 incl. VAT · not sent" } },
];

const SUGGESTIONS = ["Summarise this week's pipeline", "Who should I follow up today?", "Create a task to call Skyline", "Show VAT due this quarter"];

export default function AiPage() {
  const [turns] = React.useState<Turn[]>(SEED);
  const [q, setQ] = React.useState("");

  return (
    <AppShell active="ai" fullBleed>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, background: color.surface.page }}>
        <div style={{ flexShrink: 0, padding: "18px 24px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: color.brand.primaryTint, color: color.brand.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✦</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: color.ink.DEFAULT }}>Ask Xentral AI</span>
          </div>
          <div style={{ fontSize: 12.5, color: color.ink.mid, marginTop: 4 }}>Ask in plain language. The AI reads your workspace and can take actions — money moves and sends always ask first.</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "24px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {turns.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: t.who === "you" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%" }}>
                  <div style={{ background: t.who === "you" ? color.brand.primary : "#fff", color: t.who === "you" ? "#fff" : color.ink.DEFAULT, border: t.who === "you" ? "none" : `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, lineHeight: "21px" }}>{t.text}</div>
                  {t.action ? (
                    <div style={{ marginTop: 8, background: color.brand.primaryTint, border: `1px solid ${color.brand.primaryTint}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: color.brand.primary }}>{t.action.label}</div>
                        <div style={{ fontSize: 12, color: color.brand.primary, opacity: 0.85 }}>{t.action.detail}</div>
                      </div>
                      <span style={{ fontSize: 18, color: color.brand.primary, flexShrink: 0 }}>→</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flexShrink: 0, background: color.surface.card, borderTop: `1px solid ${color.line.DEFAULT}`, padding: "12px 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => setQ(s)} style={{ fontSize: 12.5, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 999, padding: "6px 12px", color: color.ink.DEFAULT, cursor: "pointer" }}>{s}</button>)}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask Xentral AI anything…" style={{ flex: 1, height: 44, border: `1px solid ${color.line.strong}`, borderRadius: 12, padding: "0 16px", fontSize: 14, color: color.ink.DEFAULT, outline: "none" }} />
              <button style={{ height: 44, padding: "0 20px", borderRadius: 12, background: color.brand.primary, color: "#fff", border: 0, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
