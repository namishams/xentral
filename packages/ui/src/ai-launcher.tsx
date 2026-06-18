"use client";

import * as React from "react";
import { color } from "@xentral/config";

/**
 * Xentral AI — global command band, ported 1:1 from the old build.
 * The conversation runs INLINE inside the band (no slide-over / HTML pop-up).
 * Any page can seed it by dispatching:
 *   window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: { q } | { prefill } }))
 * (AskAiButton does exactly this). Calls /api/ai/command.
 */

const BLUE = "#0064d9";

function Spark({ size = 18, color: c = BLUE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5l1.6 4.9a4 4 0 0 0 2.5 2.5L21 11.5l-4.4 1.6a4 4 0 0 0-2.5 2.5L12 20.5l-1.6-4.9a4 4 0 0 0-2.5-2.5L3.5 11.5l4.4-1.6a4 4 0 0 0 2.5-2.5L12 2.5z" fill={c} />
      <path d="M19 3l.7 2.1a1.5 1.5 0 0 0 1 1L23 7l-2.3.9a1.5 1.5 0 0 0-1 1L19 11l-.7-2.1a1.5 1.5 0 0 0-1-1L15 7l2.3-.9a1.5 1.5 0 0 0 1-1L19 3z" fill={c} opacity="0.55" />
    </svg>
  );
}

const DEFAULT_SUGGESTIONS = [
  "Add a contact: Sarah Klein, sarah@acme.ae",
  "Create a task to follow up with the overdue invoices tomorrow",
  "Add a new deal “Acme renewal” worth 25000",
  "What should I focus on today?",
  "Which invoices are overdue?",
  "Summarize the state of the business.",
];

const HELP_GROUPS = [
  { title: "Find & answer", items: ["What should I focus on today?", "Which deals are at risk?", "Summarize the business"] },
  { title: "Create", items: ["Add a contact: Sara, sara@acme.ae", "Draft an invoice for Acme", "Schedule a call with Omar tomorrow 3pm"] },
  { title: "Manage", items: ["Reassign Acme renewal to Nami", "Assign a task to Nami: call new leads", "Set the Acme deal to 25000"] },
];

type Action = { type?: string; summary?: string; label?: string; link?: string; href?: string };
type Turn = { q: string; a: string; model?: string; provider?: string; actions?: Action[] };

export function AiCommandBand({ agentKey = "ceo", context, suggestions, placeholder }: {
  agentKey?: string; context?: string; suggestions?: string[]; placeholder?: string;
} = {}) {
  const starters = suggestions && suggestions.length ? suggestions : DEFAULT_SUGGESTIONS;
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [err, setErr] = React.useState<{ msg: string; notConfigured?: boolean } | null>(null);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const sectionRef = React.useRef<HTMLDivElement | null>(null);
  const turnsRef = React.useRef<Turn[]>([]);
  React.useEffect(() => { turnsRef.current = turns; }, [turns]);

  React.useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [turns, loading]);

  const ask = React.useCallback(async (text?: string) => {
    const prompt = (text ?? q).trim();
    if (!prompt || loading) return;
    setErr(null); setLoading(true); setQ("");
    const history = turnsRef.current.flatMap((t) => [{ role: "user", content: t.q }, { role: "assistant", content: t.a }]);
    try {
      const r = await fetch("/api/ai/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, agentKey, context, history }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErr({ msg: d.error || "Request failed", notConfigured: d.notConfigured });
      else setTurns((t) => [...t, { q: prompt, a: d.answer || "", model: d.model, provider: d.provider, actions: d.actions }]);
    } catch { setErr({ msg: "Could not reach the AI service." }); }
    setLoading(false);
  }, [q, loading, agentKey, context]);

  // Seed from anywhere (AskAiButton, header field). Runs INLINE — no pop-up.
  React.useEffect(() => {
    const onAsk = (e: Event) => {
      const det = (e as CustomEvent).detail || {};
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (det.q && String(det.q).trim()) setTimeout(() => ask(String(det.q)), 80);
      else if (det.prefill) { setQ(String(det.prefill)); setTimeout(() => taRef.current?.focus(), 80); }
      else taRef.current?.focus();
    };
    window.addEventListener("xentral-ai-ask", onAsk as EventListener);
    return () => window.removeEventListener("xentral-ai-ask", onAsk as EventListener);
  }, [ask]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } };

  return (
    <div style={{ background: color.surface.page, borderBottom: `1px solid ${color.line.DEFAULT}`, padding: "14px 24px" }}>
      <div ref={sectionRef} style={{ maxWidth: 1280, margin: "0 auto", borderRadius: 16, padding: 1.5, background: "linear-gradient(90deg, #0064d9, #3B82F6, #22D3A6)", boxShadow: "0 10px 30px -16px rgba(60,70,140,0.45)" }}>
        <div style={{ borderRadius: 14.5, background: color.surface.card }}>
          {/* conversation (inline) */}
          {turns.length > 0 && (
            <div ref={scrollRef} style={{ maxHeight: 320, overflowY: "auto", padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 16, borderBottom: `1px solid ${color.line.DEFAULT}` }}>
              {turns.map((t, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: "#eef4ff", color: "#1c2c3d", fontSize: 13.5, borderRadius: 14, borderBottomRightRadius: 4, padding: "8px 13px", maxWidth: "85%" }}>{t.q}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #0064d9, #22D3A6)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Spark size={15} color="#fff" /></span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: "#1c2c3d", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{t.a}</div>
                      {t.actions && t.actions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          {t.actions.map((a, j) => {
                            const label = a.summary || a.label || "Done";
                            const href = a.link || a.href;
                            const st: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: "#188918", background: "#eef6ee", border: "1px solid #cfe8cf", borderRadius: 999, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" };
                            return href ? <a key={j} href={href} style={st}>✓ {label}</a> : <span key={j} style={st}>✓ {label}</span>;
                          })}
                        </div>
                      )}
                      {t.model && <div style={{ fontSize: 10.5, color: color.ink.soft, marginTop: 4 }}>{t.provider} · {t.model}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {loading && <div style={{ display: "flex", gap: 10, paddingBottom: 8 }}><span style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #0064d9, #22D3A6)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Spark size={15} color="#fff" /></span><span style={{ fontSize: 13, color: BLUE, fontWeight: 600, marginTop: 5 }}>Thinking…</span></div>}
            </div>
          )}

          {/* input */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
              <Spark size={18} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#16202c", margin: 0 }}>Ask Xentral AI</h2>
              <span style={{ fontSize: 11.5, color: "#647082" }}>· reads your live data <b style={{ color: "#188918" }}>and takes actions</b> — add contacts, tasks, deals, notes</span>
              <button type="button" onClick={() => setShowHelp((v) => !v)} style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: BLUE, background: "transparent", border: 0, cursor: "pointer", flexShrink: 0 }}>What can I ask?</button>
              <a href="/settings" title="AI settings" style={{ color: color.ink.soft, display: "inline-flex", flexShrink: 0 }} aria-label="AI settings"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></a>
            </div>

            {showHelp && (
              <div style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.page, padding: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#16202c", margin: "0 0 8px" }}>Try asking — click to use</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px 16px" }}>
                  {HELP_GROUPS.map((g) => (
                    <div key={g.title}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: color.ink.soft, margin: "0 0 4px" }}>{g.title}</p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {g.items.map((x) => <button key={x} type="button" onClick={() => { setQ(x); setShowHelp(false); taRef.current?.focus(); }} style={{ textAlign: "left", fontSize: 12, color: BLUE, background: "transparent", border: 0, cursor: "pointer", padding: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x}</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ position: "relative" }}>
              <textarea ref={taRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} rows={2}
                placeholder={placeholder || "Ask anything, or tell Xentral what to do… e.g. “Review my pipeline and tell me what to chase.”"}
                style={{ width: "100%", boxSizing: "border-box", resize: "none", overflowY: "auto", borderRadius: 12, border: `1px solid ${color.line.strong}`, background: color.surface.page, padding: "10px 48px 10px 14px", fontSize: 14, lineHeight: 1.4, color: "#16202c", fontFamily: "inherit", outline: "none" }} />
              <button onClick={() => ask()} disabled={loading || !q.trim()} aria-label="Send"
                style={{ position: "absolute", right: 10, bottom: 10, width: 32, height: 32, borderRadius: 9, background: BLUE, border: 0, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: loading || !q.trim() ? "default" : "pointer", opacity: loading || !q.trim() ? 0.4 : 1, fontSize: 16 }}>↑</button>
            </div>

            {err && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#b3261e", background: "#fdeeec", border: "1px solid #f6d4cf", borderRadius: 10, padding: "8px 12px" }}>
                <span>{err.msg}</span>
                {err.notConfigured && <a href="/settings" style={{ marginLeft: "auto", fontWeight: 600, color: BLUE, flexShrink: 0 }}>Set up AI →</a>}
              </div>
            )}

            {turns.length === 0 && !err && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                {starters.map((s) => <button key={s} onClick={() => ask(s)} style={{ fontSize: 12, fontWeight: 500, color: "#44566a", background: color.surface.page, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>{s}</button>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** AiLauncher — retired slide-over. AI runs inline in AiCommandBand now; this is a no-op to keep imports stable. */
export function AiLauncher() { return null; }

/** HeaderAiField — compact AI field for the top bar; seeds the inline band. */
export function HeaderAiField() {
  const [v, setV] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const submit = () => { const t = v.trim(); window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: { q: t } })); setV(""); };
  const has = v.trim().length > 0;
  return (
    <div style={{ flex: 1, maxWidth: 540, minWidth: 0, display: "flex", alignItems: "center", gap: 9, height: 36, padding: "0 6px 0 8px", borderRadius: 10, background: "var(--surface-card)", border: `1px solid ${focused ? BLUE : "var(--line-strong)"}`, boxShadow: focused ? "0 0 0 3px rgba(0,100,217,0.14)" : "none", transition: "border-color 120ms ease, box-shadow 120ms ease" }}>
      <Spark size={16} />
      <input value={v} onChange={(e) => setV(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} placeholder="Ask Xentral AI — or type a command…" aria-label="Ask Xentral AI" style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 13, color: "var(--ink)", fontFamily: "inherit" }} />
      {has ? <button onClick={submit} aria-label="Send to Xentral AI" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: 0, cursor: "pointer", background: BLUE, color: "#fff", fontSize: 14 }}>↑</button>
        : <kbd style={{ flexShrink: 0, marginRight: 4, fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 5, padding: "1px 5px", fontFamily: "inherit" }}>⏎</kbd>}
    </div>
  );
}

/** AskAiButton — drop on any quiet surface; seeds the inline band (no pop-up). */
export function AskAiButton({ seed, label = "Ask Xentral AI", variant = "pill" }: { seed?: string; label?: string; variant?: "pill" | "ghost" }) {
  const ask = () => window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: seed ? { q: seed } : {} }));
  if (variant === "ghost") return <button onClick={ask} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: BLUE, background: "transparent", border: 0, cursor: "pointer" }}><Spark size={14} /> {label}</button>;
  return <button onClick={ask} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: 9, border: "1px solid #cfe0ff", background: "#eef4ff", color: BLUE, cursor: "pointer" }}><Spark size={14} /> {label}</button>;
}
