"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell } from "@xentral/ui";

type Msg = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = ["Summarise this week's pipeline", "Draft a WhatsApp follow-up for a warm lead", "Write invoice line items for an office fit-out", "What VAT do I owe this quarter?"];

export default function AiPage() {
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scroller = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const d = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: d.reply || d.error || "No response." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally { setBusy(false); }
  }

  const empty = msgs.length === 0;

  return (
    <AppShell active="ai">
      <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${color.brand.primary}, #6b3fd4)`, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✦</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: color.ink.DEFAULT }}>Ask Xentral AI</h1>
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>Your workspace copilot · CRM, invoicing, WhatsApp &amp; more</div>
          </div>
        </div>

        <div ref={scroller} style={{ flex: 1, overflowY: "auto", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 14, background: color.surface.card, padding: 18 }}>
          {empty ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: color.ink.soft }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${color.brand.primary}, #6b3fd4)`, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 14 }}>✦</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 4 }}>How can I help you run your business?</div>
              <div style={{ fontSize: 13, maxWidth: 420 }}>Ask about your pipeline, draft messages and invoices, or get answers about VAT, customers and cash flow.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "78%", padding: "11px 14px", borderRadius: 13, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap",
                    background: m.role === "user" ? color.brand.primary : color.surface.sunken,
                    color: m.role === "user" ? color.ink.onPrimary : color.ink.DEFAULT,
                    borderTopRightRadius: m.role === "user" ? 4 : 13, borderTopLeftRadius: m.role === "user" ? 13 : 4 }}>{m.content}</div>
                </div>
              ))}
              {busy ? <div style={{ fontSize: 13, color: color.ink.soft, paddingLeft: 4 }}>Xentral AI is thinking…</div> : null}
            </div>
          )}
        </div>

        {empty ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0 10px" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} style={{ fontSize: 12.5, padding: "7px 12px", borderRadius: 999, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        ) : <div style={{ height: 12 }} />}

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Message Xentral AI…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            style={{ flex: 1, resize: "none", minHeight: 48, maxHeight: 140, border: `1px solid ${color.line.strong}`, borderRadius: 12, padding: "13px 14px", fontSize: 14, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} style={{ height: 48, padding: "0 20px", border: 0, borderRadius: 12, background: busy || !input.trim() ? color.line.strong : color.brand.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy || !input.trim() ? "default" : "pointer" }}>Send</button>
        </div>
        <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 10 }}>Xentral AI can make mistakes — check important details.</p>
      </div>
    </AppShell>
  );
}
