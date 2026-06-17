"use client";

import * as React from "react";
import { color, zIndex } from "@xentral/config";

/**
 * AiLauncher — the global Xentral AI affordance, mounted once in AppShell so AI
 * is reachable on every page. A floating pill (bottom-right) opens a slide-over
 * chat. Any page can open it pre-seeded by dispatching:
 *   window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: { q } }))
 * (the AskAiButton component does exactly this). Calls /api/ai/chat.
 */
const ACCENT = "#6b4ed9";       // Xentral AI purple — the AI identity accent
const ACCENT_SOFT = "#f3f1fe";

type Msg = { role: "user" | "assistant"; content: string };

export function AiLauncher() {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scroller = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const send = React.useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgsRef.current, { role: "user", content: q }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const d = await res.json().catch(() => ({}));
      setMsgs((m) => [...m, { role: "assistant", content: d.reply || d.error || "Sorry, I couldn't respond just now." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally { setBusy(false); }
  }, [busy]);

  // keep a ref of msgs so the event handler always sees the latest
  const msgsRef = React.useRef<Msg[]>(msgs);
  React.useEffect(() => { msgsRef.current = msgs; }, [msgs]);

  React.useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent).detail?.q as string | undefined;
      setOpen(true);
      setTimeout(() => { if (q && q.trim()) send(q); else inputRef.current?.focus(); }, 60);
    };
    window.addEventListener("xentral-ai-ask", onAsk as EventListener);
    return () => window.removeEventListener("xentral-ai-ask", onAsk as EventListener);
  }, [send]);

  React.useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, busy]);

  const suggestions = ["Summarise my outstanding invoices", "Draft a follow-up email to a customer", "What's the UAE VAT rate?"];

  return (
    <>
      {/* Floating launch pill */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Ask Xentral AI" style={{
          position: "fixed", right: 22, bottom: 22, zIndex: zIndex.drawer,
          display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 18px 0 16px",
          borderRadius: 999, border: 0, cursor: "pointer", color: "#fff", fontSize: 13.5, fontWeight: 700,
          background: `linear-gradient(135deg, ${ACCENT}, #8b5cf6)`, boxShadow: "0 8px 24px -6px rgba(107,78,217,0.5)",
        }}>
          <span style={{ fontSize: 16 }}>✦</span> Ask Xentral AI
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.35)", zIndex: zIndex.drawer }} />
          <aside style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: "min(420px, 100vw)", background: color.surface.card, borderLeft: `1px solid ${color.line.DEFAULT}`, boxShadow: "-16px 0 40px -16px rgba(20,28,38,0.3)", zIndex: zIndex.drawer + 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${ACCENT}, #8b5cf6)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✦</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT }}>Xentral AI</div>
                  <div style={{ fontSize: 11.5, color: color.ink.soft }}>Built-in assistant</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 22, lineHeight: 1, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>

            <div ref={scroller} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {msgs.length === 0 ? (
                <div style={{ margin: "auto 0", textAlign: "center", color: color.ink.soft }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>✦</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, marginBottom: 4 }}>How can I help?</div>
                  <div style={{ fontSize: 12.5, marginBottom: 16 }}>Ask about your pipeline, draft messages and invoices, or get answers about VAT and cash flow.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} style={{ textAlign: "left", fontSize: 12.5, color: color.ink.DEFAULT, background: color.surface.page, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "9px 11px", cursor: "pointer" }}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "85%", fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap", padding: "9px 12px", borderRadius: 12,
                    background: m.role === "user" ? color.brand.primary : ACCENT_SOFT,
                    color: m.role === "user" ? "#fff" : color.ink.DEFAULT,
                    border: m.role === "user" ? "0" : `1px solid #e6e1fb` }}>{m.content}</div>
                </div>
              ))}
              {busy && <div style={{ fontSize: 12.5, color: ACCENT, fontWeight: 600 }}>Xentral AI is thinking…</div>}
            </div>

            <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, padding: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Ask anything…" style={{ flex: 1, resize: "none", maxHeight: 120, border: `1px solid ${color.line.strong}`, borderRadius: 10, padding: "9px 11px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, fontFamily: "inherit", outline: "none" }} />
                <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Send" style={{ width: 38, height: 38, borderRadius: 10, border: 0, cursor: busy || !input.trim() ? "default" : "pointer", background: `linear-gradient(135deg, ${ACCENT}, #8b5cf6)`, color: "#fff", fontSize: 16, opacity: busy || !input.trim() ? 0.5 : 1, flexShrink: 0 }}>↑</button>
              </div>
              <div style={{ fontSize: 10.5, color: color.ink.soft, marginTop: 6, textAlign: "center" }}>Xentral AI can make mistakes — verify important results.</div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

/**
 * AskAiButton — drop on any quiet/empty surface. Opens the global launcher
 * pre-seeded with `seed`. Mirrors the original app's pattern exactly.
 */
export function AskAiButton({ seed, label = "Ask Xentral AI", variant = "pill" }: { seed?: string; label?: string; variant?: "pill" | "ghost" }) {
  const ask = () => window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: { q: seed || "" } }));
  if (variant === "ghost") {
    return <button onClick={ask} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#6b4ed9", background: "transparent", border: 0, cursor: "pointer" }}><span>✦</span> {label}</button>;
  }
  return <button onClick={ask} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: 9, border: "1px solid #ddd6fb", background: "#f3f1fe", color: "#6b4ed9", cursor: "pointer" }}><span>✦</span> {label}</button>;
}
