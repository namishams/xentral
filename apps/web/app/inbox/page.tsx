"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Input, EmptyState } from "@xentral/ui";

type Conv = { id: string; name: string | null; phone: string; preview: string | null; at: string | null; unread: number; status: string; mode: string };
type Msg = { direction: string; body: string | null; type: string; isAi: boolean; timestamp: string; sentBy: string | null };

const initials = (s: string) => s.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-9);
const fmt = (s: string | null) => { if (!s) return ""; const d = new Date(s); return isNaN(+d) ? "" : d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };
const WA_GREEN = "#1DAA61";

export default function InboxPage() {
  const [convs, setConvs] = React.useState<Conv[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [isOperator, setIsOperator] = React.useState(false);
  const [leadStatus, setLeadStatus] = React.useState<Record<string, { status: string; soldPrice: number | null }>>({});

  const loadConvs = React.useCallback(() => {
    fetch("/api/whatsapp/conversations").then((r) => r.json()).then((d) => {
      const list: Conv[] = d.conversations ?? [];
      setConvs(list); setActiveId((cur) => cur ?? (list[0]?.id ?? null)); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { loadConvs(); }, [loadConvs]);
  React.useEffect(() => { fetch("/api/me").then((r) => r.json()).then((d) => setIsOperator(!!d.superAdmin)).catch(() => {}); }, []);
  React.useEffect(() => {
    fetch("/api/whatsapp/listed-leads").then((r) => r.json()).then((d) => {
      const map: Record<string, { status: string; soldPrice: number | null }> = {};
      (Array.isArray(d.leads) ? d.leads : []).forEach((l: { phone: string; status: string; soldPrice: number | null }) => {
        const k = normPhone(l.phone); if (k) map[k] = { status: String(l.status || "").toUpperCase(), soldPrice: l.soldPrice != null ? Number(l.soldPrice) : null };
      });
      setLeadStatus(map);
    }).catch(() => {});
  }, []);
  const statusFor = (phone: string) => leadStatus[normPhone(phone)];

  const loadMsgs = React.useCallback((id: string) => {
    fetch(`/api/whatsapp/conversations/${id}/messages`).then((r) => r.json()).then((d) => setMsgs(d.messages ?? [])).catch(() => setMsgs([]));
  }, []);
  React.useEffect(() => { if (activeId) loadMsgs(activeId); }, [activeId, loadMsgs]);

  const active = convs.find((c) => c.id === activeId) || null;
  const filtered = convs.filter((c) => (filter === "all" || c.unread > 0) && ((c.name || "") + c.phone).toLowerCase().includes(q.toLowerCase()));
  const qualifying = convs.filter((c) => String(c.status || "").toUpperCase().includes("QUALIF")).length;

  const send = async () => {
    if (!reply.trim() || !activeId) return;
    setSending(true);
    try {
      const r = await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, message: reply.trim() }) });
      if (r.ok) { setReply(""); loadMsgs(activeId); loadConvs(); }
    } catch { /* noop */ }
    setSending(false);
  };

  const listOnMarketplace = () => {
    if (!active) return;
    const params = new URLSearchParams({ waConv: active.id, waName: active.name || "", waPhone: active.phone || "" });
    window.location.href = `/admin?${params.toString()}`;
  };

  const StatusPill = ({ phone, big }: { phone: string; big?: boolean }) => {
    const st = statusFor(phone); if (!st) return null; const sold = st.status === "SOLD";
    return <span style={{ display: "inline-block", fontSize: big ? 11.5 : 10, fontWeight: 700, borderRadius: big ? 6 : 5, padding: big ? "4px 9px" : "1px 6px", background: sold ? "rgba(34,211,166,0.14)" : color.brand.primaryTint, color: sold ? color.status.positive : color.brand.primary, whiteSpace: "nowrap" }}>{sold ? `✓ Sold${st.soldPrice ? " · AED " + Math.round(st.soldPrice) : ""}` : "● Listed"}</span>;
  };

  return (
    <AppShell active="inbox" fullBleed>
      <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: WA_GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✆</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{isOperator ? "WhatsApp — Lead Intake" : "WhatsApp"}</h1>
              {isOperator ? <span style={{ fontSize: 11, fontWeight: 700, color: WA_GREEN, background: "rgba(29,170,97,0.10)", borderRadius: 6, padding: "2px 8px" }}>Mediflow</span> : null}
            </div>
            <div style={{ fontSize: 12, color: color.ink.soft }}>{isOperator ? "AI agent active · " : ""}{convs.length} conversations{qualifying ? ` · ${qualifying} qualifying` : ""}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: active ? "300px 1fr 280px" : "300px 1fr", gap: 0, height: "calc(100vh - 64px - 64px)", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", margin: "12px 18px 18px", background: color.surface.card }}>

        {/* Conversation list */}
        <div style={{ borderRight: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
            <span style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
              {([["all", `All (${convs.length})`], ["unread", `Unread (${convs.filter((c) => c.unread > 0).length})`]] as const).map(([id, lab]) => (
                <button key={id} onClick={() => setFilter(id)} style={{ border: 0, background: filter === id ? color.brand.primaryTint : color.surface.card, color: filter === id ? color.brand.primary : color.ink.mid, fontSize: 12, fontWeight: 600, padding: "5px 11px", cursor: "pointer" }}>{lab}</button>
              ))}
            </span>
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
                          {c.unread > 0 ? <span style={{ background: WA_GREEN, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{c.unread}</span> : null}
                        </span>
                        <span style={{ display: "block", fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.preview || "—"}</span>
                        <span style={{ display: "block", marginTop: 3 }}><StatusPill phone={c.phone} /></span>
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
              <EmptyState title="Select a conversation" hint="Pick a chat on the left — then qualify, reply, or list it on the marketplace." />
            </div>
          ) : (
            <>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{initials(active.name || active.phone)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT }}>{active.name || active.phone}</span>
                  <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{active.phone} · {active.mode === "AI" ? "AI agent" : "Manual"}</span>
                </span>
                <StatusPill phone={active.phone} big />
                {isOperator && statusFor(active.phone)?.status !== "SOLD" ? (
                  <button onClick={listOnMarketplace} title="Turn this lead into a marketplace listing" style={{ height: 32, padding: "0 12px", borderRadius: 8, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{statusFor(active.phone) ? "🏪 Re-list" : "🏪 Verkaufen"}</button>
                ) : null}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, background: color.surface.page, display: "flex", flexDirection: "column", gap: 8 }}>
                {msgs.length === 0 ? <div style={{ color: color.ink.soft, fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages.</div>
                  : msgs.map((m, i) => {
                    const out = m.direction === "OUTBOUND";
                    return (
                      <div key={i} style={{ alignSelf: out ? "flex-end" : "flex-start", maxWidth: "72%", background: out ? "#DCF8C6" : color.surface.card, color: color.ink.DEFAULT, border: out ? "none" : `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "8px 12px", fontSize: 13.5, lineHeight: "18px" }}>
                        {m.body || `[${m.type}]`}
                        <span style={{ display: "block", fontSize: 10.5, color: color.ink.soft, marginTop: 3 }}>{m.isAi ? "AI · " : ""}{fmt(m.timestamp)}</span>
                      </div>
                    );
                  })}
              </div>
              <div style={{ padding: 10, borderTop: `1px solid ${color.line.DEFAULT}`, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ display: "inline-flex", gap: 2, color: color.ink.soft }} aria-hidden="true">
                  <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>＋</span>
                  <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📎</span>
                </span>
                <Input placeholder="Type a message…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} style={{ flex: 1 }} />
                <button onClick={send} disabled={sending || !reply.trim()} aria-label="Send" style={{ width: 42, height: 42, borderRadius: "50%", border: 0, background: sending || !reply.trim() ? color.line.strong : WA_GREEN, color: "#fff", fontSize: 17, cursor: sending || !reply.trim() ? "default" : "pointer", flexShrink: 0 }}>➤</button>
              </div>
            </>
          )}
        </div>

        {/* Detail sidebar */}
        {active ? (
          <div style={{ borderLeft: `1px solid ${color.line.DEFAULT}`, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ width: 56, height: 56, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>{initials(active.name || active.phone)}</span>
              <div style={{ fontWeight: 700, color: color.ink.DEFAULT, marginTop: 8 }}>{active.name || active.phone}</div>
              <div style={{ fontSize: 12.5, color: color.ink.soft }}>{active.phone}</div>
              <div style={{ marginTop: 8 }}><StatusPill phone={active.phone} big /></div>
            </div>

            <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase", marginBottom: 8 }}>Lead actions</div>
              {isOperator ? (
                statusFor(active.phone)?.status === "SOLD"
                  ? <div style={{ fontSize: 12.5, color: color.status.positive, fontWeight: 600 }}>✓ Sold on the marketplace.</div>
                  : <button onClick={listOnMarketplace} style={{ width: "100%", height: 38, borderRadius: 9, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🏪 {statusFor(active.phone) ? "Re-list on marketplace" : "List on marketplace"}</button>
              ) : <div style={{ fontSize: 12.5, color: color.ink.soft }}>Lead-supply actions are available to the Mediflow operator.</div>}
              <button onClick={() => (window.location.href = "/companies")} style={{ width: "100%", height: 36, marginTop: 8, borderRadius: 9, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>↗ Open in CRM</button>
            </div>

            <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12, fontSize: 11.5, color: color.ink.soft, lineHeight: "17px" }}>
              Leads arrive on Mediflow’s WhatsApp. Qualify here, then list to sell on the marketplace.
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
