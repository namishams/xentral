"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Input, Button, EmptyState } from "@xentral/ui";

type Conv = { id: string; name: string | null; phone: string; preview: string | null; at: string | null; unread: number; status: string; mode: string };
type Msg = { direction: string; body: string | null; type: string; isAi: boolean; timestamp: string; sentBy: string | null };

const initials = (s: string) => s.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const fmt = (s: string | null) => { if (!s) return ""; const d = new Date(s); return isNaN(+d) ? "" : d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };

export default function InboxPage() {
  const [convs, setConvs] = React.useState<Conv[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [isOperator, setIsOperator] = React.useState(false);

  const loadConvs = React.useCallback(() => {
    fetch("/api/whatsapp/conversations").then((r) => r.json()).then((d) => {
      const list: Conv[] = d.conversations ?? [];
      setConvs(list);
      setActiveId((cur) => cur ?? (list[0]?.id ?? null));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { loadConvs(); }, [loadConvs]);
  React.useEffect(() => { fetch("/api/me").then((r) => r.json()).then((d) => setIsOperator(!!d.superAdmin)).catch(() => {}); }, []);

  const loadMsgs = React.useCallback((id: string) => {
    fetch(`/api/whatsapp/conversations/${id}/messages`).then((r) => r.json()).then((d) => setMsgs(d.messages ?? [])).catch(() => setMsgs([]));
  }, []);
  React.useEffect(() => { if (activeId) loadMsgs(activeId); }, [activeId, loadMsgs]);

  const active = convs.find((c) => c.id === activeId) || null;
  const filtered = convs.filter((c) => ((c.name || "") + c.phone).toLowerCase().includes(q.toLowerCase()));

  const send = async () => {
    if (!reply.trim() || !activeId) return;
    setSending(true);
    try {
      const r = await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, message: reply.trim() }) });
      if (r.ok) { setReply(""); loadMsgs(activeId); loadConvs(); }
    } catch { /* noop */ }
    setSending(false);
  };

  // Operator-only: turn this WhatsApp lead into a marketplace listing.
  // Routes to the Admin console with the contact pre-filled into the Add-Lead form,
  // where the operator picks listing type (Shared / Exclusive / Best Offer) + price.
  const listOnMarketplace = () => {
    if (!active) return;
    const params = new URLSearchParams({ waName: active.name || "", waPhone: active.phone || "" });
    window.location.href = `/admin?${params.toString()}`;
  };

  return (
    <AppShell active="inbox" fullBleed>
      <div style={{ padding: "14px 18px 0" }}>
        <PageTitleRow title="WhatsApp" subtitle={`${convs.length} conversations`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0, height: "calc(100vh - 64px - 70px)", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", margin: "0 18px 18px", background: color.surface.card }}>

        {/* Conversation list */}
        <div style={{ borderRight: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${color.line.DEFAULT}` }}>
            <Input placeholder="Search chats…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? <div style={{ padding: 20, color: color.ink.soft, fontSize: 13 }}>Loading…</div>
              : filtered.length === 0 ? <div style={{ padding: 20, color: color.ink.soft, fontSize: 13 }}>No conversations yet.</div>
                : filtered.map((c) => {
                  const on = c.id === activeId;
                  return (
                    <button key={c.id} onClick={() => setActiveId(c.id)} style={{ width: "100%", textAlign: "left", border: "none", borderBottom: `1px solid ${color.line.DEFAULT}`, background: on ? color.brand.primaryTint : "transparent", cursor: "pointer", padding: "11px 13px", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ width: 38, height: 38, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials(c.name || c.phone)}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || c.phone}</span>
                          {c.unread > 0 ? <span style={{ background: color.status.positive, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{c.unread}</span> : null}
                        </span>
                        <span style={{ display: "block", fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.preview || "—"}</span>
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Thread */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {!active ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmptyState title="Select a conversation" hint="Choose a chat on the left to view the thread." />
            </div>
          ) : (
            <>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{initials(active.name || active.phone)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT }}>{active.name || active.phone}</span>
                  <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{active.phone} · {active.mode === "AI" ? "AI mode" : "Manual"}</span>
                </span>
                {isOperator ? (
                  <button onClick={listOnMarketplace} title="Turn this lead into a marketplace listing" style={{ height: 34, padding: "0 13px", borderRadius: 8, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>🏪 List on marketplace</button>
                ) : null}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, background: color.surface.page, display: "flex", flexDirection: "column", gap: 8 }}>
                {msgs.length === 0 ? <div style={{ color: color.ink.soft, fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages.</div>
                  : msgs.map((m, i) => {
                    const out = m.direction === "OUTBOUND";
                    return (
                      <div key={i} style={{ alignSelf: out ? "flex-end" : "flex-start", maxWidth: "72%", background: out ? color.brand.primary : color.surface.card, color: out ? color.ink.onPrimary : color.ink.DEFAULT, border: out ? "none" : `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "8px 12px", fontSize: 13.5, lineHeight: "18px" }}>
                        {m.body || `[${m.type}]`}
                        <span style={{ display: "block", fontSize: 10.5, opacity: 0.7, marginTop: 3 }}>{m.isAi ? "AI · " : ""}{fmt(m.timestamp)}</span>
                      </div>
                    );
                  })}
              </div>
              <div style={{ padding: 12, borderTop: `1px solid ${color.line.DEFAULT}`, display: "flex", gap: 8 }}>
                <Input placeholder="Type a reply…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} style={{ flex: 1 }} />
                <Button variant="primary" onClick={send} disabled={sending || !reply.trim()}>{sending ? "Sending…" : "Send"}</Button>
              </div>
            </>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", margin: "0 0 14px" }}>WhatsApp inbox · live conversations via DataPort · reply through the Meta Cloud API · AI auto-reply opt-in</p>
    </AppShell>
  );
}
