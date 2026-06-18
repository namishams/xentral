"use client";

import * as React from "react";
import { color } from "@xentral/config";

/**
 * Xentral AI — floating dock launcher.
 * Collapsed by default to a small bottom-right pill so it never steals
 * vertical space or fights page scroll. Expands into a compact chat popover
 * (position: fixed — outside the content flow).
 * Any page seeds it by dispatching:
 *   window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: { q } | { prefill } }))
 * (AskAiButton / HeaderAiField do this). Calls /api/ai/command.
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
  "What should I focus on today?",
  "Which invoices are overdue?",
  "Add a contact: Sarah Klein, sarah@acme.ae",
  "Add a deal “Acme renewal” worth 25000",
];

type Action = { type?: string; summary?: string; label?: string; link?: string; href?: string };
type Turn = { q: string; a: string; model?: string; provider?: string; actions?: Action[] };

export function AiCommandBand({ agentKey = "ceo", context, suggestions, placeholder }: {
  agentKey?: string; context?: string; suggestions?: string[]; placeholder?: string;
} = {}) {
  const starters = suggestions && suggestions.length ? suggestions : DEFAULT_SUGGESTIONS;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [err, setErr] = React.useState<{ msg: string; notConfigured?: boolean } | null>(null);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const turnsRef = React.useRef<Turn[]>([]);
  React.useEffect(() => { turnsRef.current = turns; }, [turns]);
  React.useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [turns, loading, open]);

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

  // Seed from anywhere (AskAiButton, header field) → open the dock.
  React.useEffect(() => {
    const onAsk = (e: Event) => {
      const det = (e as CustomEvent).detail || {};
      setOpen(true);
      if (det.q && String(det.q).trim()) setTimeout(() => ask(String(det.q)), 80);
      else if (det.prefill) { setQ(String(det.prefill)); setTimeout(() => taRef.current?.focus(), 120); }
      else setTimeout(() => taRef.current?.focus(), 120);
    };
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener("xentral-ai-ask", onAsk as EventListener);
    window.addEventListener("xentral-ai-toggle", onToggle as EventListener);
    return () => { window.removeEventListener("xentral-ai-ask", onAsk as EventListener); window.removeEventListener("xentral-ai-toggle", onToggle as EventListener); };
  }, [ask]);

  // Cmd/Ctrl-K opens the dock.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setOpen(true); setTimeout(() => taRef.current?.focus(), 80); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } };

  // Collapsed launcher pill.
  if (!open) {
    return (
      <button onClick={() => { setOpen(true); setTimeout(() => taRef.current?.focus(), 80); }} aria-label="Ask Xentral AI"
        style={{ position: "fixed", right: 22, bottom: 22, zIndex: 60, display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px 0 13px", borderRadius: 999, border: 0, cursor: "pointer", background: color.surface.card, color: color.ink.DEFAULT, boxShadow: "0 8px 24px -6px rgba(20,30,60,0.28), 0 0 0 1px rgba(20,30,60,0.06)", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit" }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #0064d9, #22D3A6)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Spark size={15} color="#fff" /></span>
        Ask Xentral AI
        <kbd style={{ fontSize: 10, fontWeight: 600, color: color.ink.soft, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 5, padding: "1px 5px", fontFamily: "inherit" }}>⌘K</kbd>
      </button>
    );
  }

  // Expanded chat popover (fixed — outside content flow).
  return (
    <div style={{ position: "fixed", right: 22, bottom: 22, zIndex: 60, width: "min(394px, calc(100vw - 32px))", maxHeight: "min(72vh, 680px)", display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", background: color.surface.card, boxShadow: "0 24px 60px -16px rgba(20,30,60,0.42), 0 0 0 1px rgba(20,30,60,0.08)" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px 11px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: "linear-gradient(90deg, rgba(0,100,217,0.06), rgba(34,211,166,0.06))" }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #0064d9, #22D3A6)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Spark size={15} color="#fff" /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: color.ink.DEFAULT }}>Xentral AI</div>
          <div style={{ fontSize: 10.5, color: color.ink.soft }}>reads live data · takes actions</div>
        </div>
        <a href="/settings" title="AI settings" aria-label="AI settings" style={{ color: color.ink.soft, display: "inline-flex", flexShrink: 0, padding: 4 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></a>
        <button onClick={() => setOpen(false)} aria-label="Minimise" title="Minimise" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: 0, background: "transparent", color: color.ink.mid, cursor: "pointer", fontSize: 17, lineHeight: 1 }}>—</button>
      </div>

      {/* conversation */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: turns.length ? 140 : 0, overflowY: "auto", padding: turns.length ? "14px 14px 4px" : 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {turns.map((t, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "#eef4ff", color: "#1c2c3d", fontSize: 13, borderRadius: 13, borderBottomRightRadius: 4, padding: "7px 11px", maxWidth: "86%" }}>{t.q}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #0064d9, #22D3A6)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Spark size={13} color="#fff" /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#1c2c3d", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{t.a}</div>
                {t.actions && t.actions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
                    {t.actions.map((a, j) => {
                      const label = a.summary || a.label || "Done"; const href = a.link || a.href;
                      const st: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: "#188918", background: "#eef6ee", border: "1px solid #cfe8cf", borderRadius: 999, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" };
                      return href ? <a key={j} href={href} style={st}>✓ {label}</a> : <span key={j} style={st}>✓ {label}</span>;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 8, padding: "0 0 10px" }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #0064d9, #22D3A6)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Spark size={13} color="#fff" /></span><span style={{ fontSize: 13, color: BLUE, fontWeight: 600, marginTop: 3 }}>Thinking…</span></div>}
      </div>

      {/* empty-state starters */}
      {turns.length === 0 && !err && (
        <div style={{ padding: "16px 14px 4px" }}>
          <div style={{ fontSize: 12.5, color: color.ink.mid, marginBottom: 10 }}>Ask anything, or tell Xentral what to do — it reads your live data <b style={{ color: "#188918" }}>and takes actions</b>.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {starters.map((s) => <button key={s} onClick={() => ask(s)} style={{ textAlign: "left", fontSize: 12.5, fontWeight: 500, color: color.ink.DEFAULT, background: color.surface.page, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "8px 11px", cursor: "pointer" }}>{s}</button>)}
          </div>
        </div>
      )}

      {err && (
        <div style={{ margin: "10px 14px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#b3261e", background: "#fdeeec", border: "1px solid #f6d4cf", borderRadius: 10, padding: "8px 12px" }}>
          <span>{err.msg}</span>
          {err.notConfigured && <a href="/settings" style={{ marginLeft: "auto", fontWeight: 600, color: BLUE, flexShrink: 0 }}>Set up →</a>}
        </div>
      )}

      {/* input */}
      <div style={{ padding: 12, borderTop: `1px solid ${color.line.DEFAULT}` }}>
        <div style={{ position: "relative" }}>
          <textarea ref={taRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} rows={2}
            placeholder={placeholder || "Ask anything, or type a command…"}
            style={{ width: "100%", boxSizing: "border-box", resize: "none", borderRadius: 11, border: `1px solid ${color.line.strong}`, background: color.surface.page, padding: "9px 44px 9px 12px", fontSize: 13.5, lineHeight: 1.4, color: "#16202c", fontFamily: "inherit", outline: "none" }} />
          <button onClick={() => ask()} disabled={loading || !q.trim()} aria-label="Send"
            style={{ position: "absolute", right: 9, bottom: 9, width: 30, height: 30, borderRadius: 8, background: BLUE, border: 0, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: loading || !q.trim() ? "default" : "pointer", opacity: loading || !q.trim() ? 0.4 : 1, fontSize: 15 }}>↑</button>
        </div>
      </div>
    </div>
  );
}

/** AiLauncher — retired slide-over. AI runs in the floating dock now; no-op for import stability. */
export function AiLauncher() { return null; }

/** HeaderAiField — compact AI field for the top bar; opens & seeds the dock. */
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

/** AskAiButton — drop on any quiet surface; opens & seeds the floating dock. */
export function AskAiButton({ seed, label = "Ask Xentral AI", variant = "pill" }: { seed?: string; label?: string; variant?: "pill" | "ghost" }) {
  const ask = () => window.dispatchEvent(new CustomEvent("xentral-ai-ask", { detail: seed ? { q: seed } : {} }));
  if (variant === "ghost") return <button onClick={ask} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: BLUE, background: "transparent", border: 0, cursor: "pointer" }}><Spark size={14} /> {label}</button>;
  return <button onClick={ask} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, background: color.surface.card, border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "0 13px", height: 32, cursor: "pointer" }}><Spark size={15} /> {label}</button>;
}
