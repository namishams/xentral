"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, Input, EmptyState } from "@xentral/ui";

type Conv = { id: string; name: string | null; phone: string; preview: string | null; at: string | null; unread: number; status: string; mode: string; leadStatus: string | null };
type Msg = { direction: string; body: string | null; type: string; isAi: boolean; timestamp: string; sentBy: string | null };

const initials = (s: string) => s.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-9);
const fmt = (s: string | null) => { if (!s) return ""; const d = new Date(s); return isNaN(+d) ? "" : d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };
const WA_GREEN = "#1DAA61";

const LEAD: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "New", bg: color.surface.sunken, fg: color.ink.mid },
  INTERESTED: { label: "Interested", bg: "rgba(34,211,166,0.14)", fg: color.status.positive },
  CONVERTED: { label: "Converted", bg: color.brand.primaryTint, fg: color.brand.primary },
  NOT_INTERESTED: { label: "Not interested", bg: "#fbe8d4", fg: color.status.critical },
};

export default function InboxPage() {
  const [convs, setConvs] = React.useState<Conv[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "unread" | "qualifying">("all");
  const [view, setView] = React.useState<"inbox" | "broadcast">("inbox");
  const [isOperator, setIsOperator] = React.useState(false);
  const [leadStatusMap, setLeadStatusMap] = React.useState<Record<string, { status: string; soldPrice: number | null }>>({});
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [bcSel, setBcSel] = React.useState<Set<string>>(new Set());
  const [bcMsg, setBcMsg] = React.useState("");
  const [bcSending, setBcSending] = React.useState(false);

  const loadConvs = React.useCallback(() => {
    fetch("/api/whatsapp/conversations").then((r) => r.json()).then((d) => {
      const list: Conv[] = d.conversations ?? [];
      setConvs(list); setActiveId((cur) => cur ?? (list[0]?.id ?? null)); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { loadConvs(); }, [loadConvs]);
  React.useEffect(() => { fetch("/api/me").then((r) => r.json()).then((d) => setIsOperator(!!d.superAdmin)).catch(() => {}); }, []);
  const loadListed = React.useCallback(() => {
    fetch("/api/whatsapp/listed-leads").then((r) => r.json()).then((d) => {
      const map: Record<string, { status: string; soldPrice: number | null }> = {};
      (Array.isArray(d.leads) ? d.leads : []).forEach((l: { phone: string; status: string; soldPrice: number | null }) => { const k = normPhone(l.phone); if (k) map[k] = { status: String(l.status || "").toUpperCase(), soldPrice: l.soldPrice != null ? Number(l.soldPrice) : null }; });
      setLeadStatusMap(map);
    }).catch(() => {});
  }, []);
  React.useEffect(() => { loadListed(); }, [loadListed]);
  const listedFor = (phone: string) => leadStatusMap[normPhone(phone)];

  const loadMsgs = React.useCallback((id: string) => { fetch(`/api/whatsapp/conversations/${id}/messages`).then((r) => r.json()).then((d) => setMsgs(d.messages ?? [])).catch(() => setMsgs([])); }, []);
  React.useEffect(() => { if (activeId) { loadMsgs(activeId); setAiSummary(null); setNote(""); } }, [activeId, loadMsgs]);

  const active = convs.find((c) => c.id === activeId) || null;
  const filtered = convs.filter((c) =>
    (filter === "all" || (filter === "unread" && c.unread > 0) || (filter === "qualifying" && String(c.leadStatus || "PENDING") === "PENDING")) &&
    ((c.name || "") + c.phone).toLowerCase().includes(q.toLowerCase()));
  const qualifying = convs.filter((c) => String(c.leadStatus || "PENDING") === "PENDING").length;

  const send = async () => {
    if (!reply.trim() || !activeId) return; setSending(true);
    try { const r = await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, message: reply.trim() }) }); if (r.ok) { setReply(""); loadMsgs(activeId); loadConvs(); } } catch { /* noop */ }
    setSending(false);
  };
  const patch = async (id: string, body: Record<string, unknown>) => {
    const r = await fetch(`/api/whatsapp/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json().catch(() => ({}));
  };
  const setAgent = async (id: string, mode: "AI" | "HUMAN") => { setConvs((p) => p.map((c) => c.id === id ? { ...c, mode } : c)); await patch(id, { agentMode: mode }); };
  const qualify = async (id: string, leadStatus: string) => {
    setConvs((p) => p.map((c) => c.id === id ? { ...c, leadStatus } : c));
    const d = await patch(id, { leadStatus });
    if (leadStatus === "NOT_INTERESTED") { setNote("✓ Lead listed on the marketplace."); loadListed(); }
    else if (d?.contact) setNote(`✓ ${d.contact.firstName || "Contact"} linked in CRM.`);
  };
  const setStatus = async (id: string, status: string) => { await patch(id, { status }); if (status === "RESOLVED" || status === "ARCHIVED") { setActiveId(null); } loadConvs(); };
  const del = async (id: string) => { if (!window.confirm("Delete this conversation? All messages will be removed.")) return; await fetch(`/api/whatsapp/conversations/${id}`, { method: "DELETE" }); setConvs((p) => p.filter((c) => c.id !== id)); if (activeId === id) setActiveId(null); };
  const listOnMarketplace = () => { if (!active) return; const params = new URLSearchParams({ waConv: active.id, waName: active.name || "", waPhone: active.phone || "" }); window.location.href = `/admin?${params.toString()}`; };
  const analyze = async () => {
    if (!active || aiLoading) return; setAiLoading(true); setAiSummary(null);
    const recent = msgs.slice(-20).filter((m) => m.body).map((m) => `${m.direction === "INBOUND" ? "Lead" : "Agent"}: ${m.body}`).join("\n");
    try { const r = await fetch("/api/whatsapp/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation: recent, contactName: active.name || active.phone }) }); const d = await r.json(); setAiSummary(d.result || "No analysis available"); } catch { setAiSummary("AI analysis unavailable"); }
    setAiLoading(false);
  };
  const newChat = async () => {
    const phone = window.prompt("New chat — phone number (with country code):"); if (!phone) return;
    const name = window.prompt("Contact name (optional):") || "";
    const r = await fetch("/api/whatsapp/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name }) });
    const d = await r.json().catch(() => ({})); if (r.ok && d.id) { loadConvs(); setActiveId(d.id); } else window.alert(d.error || "Could not start chat.");
  };
  const sendBroadcast = async () => {
    if (!bcMsg.trim() || bcSel.size === 0) return; setBcSending(true);
    for (const id of Array.from(bcSel)) { await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: id, message: bcMsg }) }); await new Promise((r) => setTimeout(r, 250)); }
    setBcSending(false); setBcSel(new Set()); setBcMsg(""); setView("inbox"); loadConvs();
  };

  const ListedPill = ({ phone, big }: { phone: string; big?: boolean }) => { const st = listedFor(phone); if (!st) return null; const sold = st.status === "SOLD"; return <span style={{ display: "inline-block", fontSize: big ? 11 : 10, fontWeight: 700, borderRadius: 5, padding: big ? "3px 8px" : "1px 6px", background: sold ? "rgba(34,211,166,0.14)" : color.brand.primaryTint, color: sold ? color.status.positive : color.brand.primary, whiteSpace: "nowrap" }}>{sold ? `✓ Sold${st.soldPrice ? " · AED " + Math.round(st.soldPrice) : ""}` : "● Listed"}</span>; };
  const leadInfo = (ls: string | null) => LEAD[ls || "PENDING"] ?? { label: "New", bg: color.surface.sunken, fg: color.ink.mid };
  const LeadPill = ({ ls }: { ls: string | null }) => { const c = leadInfo(ls); if ((ls || "PENDING") === "PENDING") return null; return <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "1px 6px", background: c.bg, color: c.fg }}>{c.label}</span>; };
  const tabBtn = (id: "inbox" | "broadcast", label: string) => <button key={id} onClick={() => setView(id)} style={{ border: 0, background: "transparent", borderBottom: `2px solid ${view === id ? color.brand.primary : "transparent"}`, color: view === id ? color.brand.primary : color.ink.mid, fontSize: 13, fontWeight: 600, padding: "8px 4px", cursor: "pointer" }}>{label}</button>;
  const actBtn = (label: string, on: () => void, tone?: string) => <button onClick={on} style={{ height: 30, padding: "0 11px", borderRadius: 7, border: `1px solid ${tone || color.line.strong}`, background: color.surface.card, color: tone || color.ink.mid, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>;

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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {isOperator ? <span style={{ display: "flex", gap: 10 }}>{tabBtn("inbox", "Inbox")}{tabBtn("broadcast", "Broadcast")}</span> : null}
          <button onClick={newChat} style={{ height: 32, padding: "0 13px", borderRadius: 8, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋ New chat</button>
        </div>
      </div>

      {view === "broadcast" ? (
        <div style={{ margin: "12px 18px 18px", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, background: color.surface.card, padding: 18, height: "calc(100vh - 64px - 80px)", overflowY: "auto" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, margin: "0 0 4px" }}>Broadcast</h2>
          <div style={{ fontSize: 13, color: color.ink.soft, marginBottom: 12 }}>Select conversations and send one message to all of them.</div>
          <textarea value={bcMsg} onChange={(e) => setBcMsg(e.target.value)} rows={3} placeholder="Your broadcast message…" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "9px 12px", fontSize: 14, color: color.ink.DEFAULT, resize: "vertical", marginBottom: 10 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <button onClick={sendBroadcast} disabled={bcSending || !bcMsg.trim() || bcSel.size === 0} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: 0, background: bcSending || !bcMsg.trim() || bcSel.size === 0 ? color.line.strong : WA_GREEN, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{bcSending ? "Sending…" : `Send to ${bcSel.size} selected`}</button>
            <button onClick={() => setBcSel(new Set(convs.map((c) => c.id)))} style={{ fontSize: 13, color: color.brand.primary, background: "transparent", border: 0, cursor: "pointer", fontWeight: 600 }}>Select all</button>
            <button onClick={() => setBcSel(new Set())} style={{ fontSize: 13, color: color.ink.soft, background: "transparent", border: 0, cursor: "pointer" }}>Clear</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {convs.map((c) => { const on = bcSel.has(c.id); return (
              <button key={c.id} onClick={() => setBcSel((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} style={{ textAlign: "left", border: `1px solid ${on ? color.brand.primary : color.line.DEFAULT}`, background: on ? color.brand.primaryTint : color.surface.card, borderRadius: 9, padding: "9px 11px", cursor: "pointer", display: "flex", gap: 9, alignItems: "center" }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? color.brand.primary : color.line.strong}`, background: on ? color.brand.primary : "transparent", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{on ? "✓" : ""}</span>
                <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || c.phone}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{c.phone}</span></span>
              </button>
            ); })}
          </div>
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: active ? "300px 1fr 280px" : "300px 1fr", gap: 0, height: "calc(100vh - 64px - 64px)", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden", margin: "12px 18px 18px", background: color.surface.card }}>

        {/* List */}
        <div style={{ borderRight: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
            <span style={{ display: "inline-flex", border: `1px solid ${color.line.strong}`, borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
              {([["all", `All (${convs.length})`], ["unread", `Unread (${convs.filter((c) => c.unread > 0).length})`], ["qualifying", `Qualifying (${qualifying})`]] as const).map(([id, lab]) => (
                <button key={id} onClick={() => setFilter(id)} style={{ border: 0, background: filter === id ? color.brand.primaryTint : color.surface.card, color: filter === id ? color.brand.primary : color.ink.mid, fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer" }}>{lab}</button>
              ))}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? <div style={{ padding: 20, color: color.ink.soft, fontSize: 13 }}>Loading…</div>
              : filtered.length === 0 ? <div style={{ padding: 20, color: color.ink.soft, fontSize: 13 }}>No conversations.</div>
                : filtered.map((c) => { const on = c.id === activeId; return (
                  <button key={c.id} onClick={() => setActiveId(c.id)} style={{ width: "100%", textAlign: "left", border: "none", borderBottom: `1px solid ${color.line.DEFAULT}`, background: on ? color.brand.primaryTint : "transparent", cursor: "pointer", padding: "11px 13px", display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ width: 38, height: 38, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials(c.name || c.phone)}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || c.phone}</span>
                        {c.unread > 0 ? <span style={{ background: WA_GREEN, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{c.unread}</span> : null}
                      </span>
                      <span style={{ display: "block", fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.preview || "—"}</span>
                      <span style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>{c.mode === "AI" ? <span style={{ fontSize: 10, fontWeight: 700, color: color.brand.primary, background: color.brand.primaryTint, borderRadius: 5, padding: "1px 6px" }}>✦ AI</span> : null}<LeadPill ls={c.leadStatus} /><ListedPill phone={c.phone} /></span>
                    </span>
                  </button>
                ); })}
          </div>
        </div>

        {/* Thread */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {!active ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 18 }}>
              <EmptyState title="Select a conversation" hint="Pick a chat on the left — then qualify, reply, or list it on the marketplace." />
              {isOperator ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(150px, 200px))", gap: 12 }}>
                  {[["✦", "AI replies automatically", "Switch a chat to AI handling"], ["🏪", "Auto-list rejected leads", "Mark Not interested → listed"], ["📣", "Broadcast to all leads", "Send one message to many"]].map(([ic, t, s]) => (
                    <div key={t} style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 14, textAlign: "center", background: color.surface.card }}>
                      <div style={{ fontSize: 20 }}>{ic}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, marginTop: 4 }}>{t}</div>
                      <div style={{ fontSize: 11, color: color.ink.soft, marginTop: 2 }}>{s}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div style={{ padding: "9px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: color.surface.sunken, color: color.ink.mid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{initials(active.name || active.phone)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT }}>{active.name || active.phone}</span>
                  <span style={{ display: "block", fontSize: 12, color: color.ink.soft }}>{active.phone}</span>
                </span>
                {isOperator ? (
                  <>
                    <button onClick={() => setAgent(active.id, active.mode === "AI" ? "HUMAN" : "AI")} style={{ height: 30, padding: "0 11px", borderRadius: 7, border: `1px solid ${active.mode === "AI" ? color.brand.primary : color.line.strong}`, background: active.mode === "AI" ? color.brand.primaryTint : color.surface.card, color: active.mode === "AI" ? color.brand.primary : color.ink.mid, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{active.mode === "AI" ? "✦ AI active" : "✦ Hand to AI"}</button>
                    {actBtn("AI Analysis", analyze)}
                    {actBtn("Interested", () => qualify(active.id, "INTERESTED"), color.status.positive)}
                    {actBtn("Not interested → list", () => qualify(active.id, "NOT_INTERESTED"), color.status.critical)}
                    {actBtn("Converted", () => qualify(active.id, "CONVERTED"), color.brand.primary)}
                    {listedFor(active.phone)?.status !== "SOLD" ? actBtn(listedFor(active.phone) ? "🏪 Re-list" : "🏪 Verkaufen", listOnMarketplace, color.brand.primary) : null}
                    {actBtn("Resolve", () => setStatus(active.id, "RESOLVED"))}
                  </>
                ) : null}
              </div>
              <div style={{ padding: "6px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 12, color: color.ink.soft, display: "flex", gap: 14, flexWrap: "wrap", background: color.surface.page }}>
                <span>STATUS <strong style={{ color: color.ink.DEFAULT }}>{leadInfo(active.leadStatus).label}</strong></span>
                <span>HANDLING <strong style={{ color: color.ink.DEFAULT }}>{active.mode === "AI" ? "AI agent" : "Manual"}</strong></span>
                {note ? <span style={{ color: color.status.positive, fontWeight: 600 }}>{note}</span> : null}
              </div>
              {aiSummary || aiLoading ? (
                <div style={{ margin: "10px 14px 0", border: `1px solid ${color.brand.primary}`, background: color.brand.primaryTint, borderRadius: 10, padding: "10px 13px", fontSize: 13, color: color.ink.DEFAULT, lineHeight: "18px" }}>
                  <strong style={{ color: color.brand.primary }}>✦ AI analysis</strong><br />{aiLoading ? "Analysing the conversation…" : aiSummary}
                </div>
              ) : null}
              <div style={{ flex: 1, overflowY: "auto", padding: 16, background: color.surface.page, display: "flex", flexDirection: "column", gap: 8 }}>
                {msgs.length === 0 ? <div style={{ color: color.ink.soft, fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages.</div>
                  : msgs.map((m, i) => { const out = m.direction === "OUTBOUND"; return (
                    <div key={i} style={{ alignSelf: out ? "flex-end" : "flex-start", maxWidth: "72%", background: out ? "#DCF8C6" : color.surface.card, color: color.ink.DEFAULT, border: out ? "none" : `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "8px 12px", fontSize: 14, lineHeight: "18px" }}>
                      {m.body || `[${m.type}]`}
                      <span style={{ display: "block", fontSize: 11, color: color.ink.soft, marginTop: 3 }}>{m.isAi ? "AI · " : ""}{fmt(m.timestamp)}</span>
                    </div>
                  ); })}
              </div>
              <div style={{ padding: 10, borderTop: `1px solid ${color.line.DEFAULT}`, display: "flex", gap: 8, alignItems: "center" }}>
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
              <div style={{ fontSize: 13, color: color.ink.soft }}>{active.phone}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}><LeadPill ls={active.leadStatus} /><ListedPill phone={active.phone} big /></div>
            </div>
            {isOperator ? (
              <>
                <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase", marginBottom: 8 }}>CRM contact</div>
                  <button onClick={() => qualify(active.id, "INTERESTED")} style={{ width: "100%", height: 36, borderRadius: 9, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>＋ Add to CRM</button>
                </div>
                <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.ink.soft, textTransform: "uppercase" }}>Actions</div>
                  {listedFor(active.phone)?.status !== "SOLD" ? <button onClick={listOnMarketplace} style={{ width: "100%", height: 38, borderRadius: 9, border: 0, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🏪 {listedFor(active.phone) ? "Re-list on marketplace" : "List on marketplace"}</button> : <div style={{ fontSize: 13, color: color.status.positive, fontWeight: 600 }}>✓ Sold on the marketplace.</div>}
                  <button onClick={() => setStatus(active.id, "RESOLVED")} style={{ width: "100%", height: 34, borderRadius: 9, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Mark as resolved</button>
                  <button onClick={() => setStatus(active.id, "ARCHIVED")} style={{ width: "100%", height: 34, borderRadius: 9, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🗄 Archive</button>
                  <button onClick={() => { setBcSel(new Set([active.id])); setView("broadcast"); }} style={{ width: "100%", height: 34, borderRadius: 9, border: `1px solid ${color.line.strong}`, background: color.surface.card, color: color.ink.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📣 Add to broadcast</button>
                  <button onClick={() => del(active.id)} style={{ width: "100%", height: 34, borderRadius: 9, border: `1px solid ${color.status.negative}`, background: color.surface.card, color: color.status.negative, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🗑 Delete chat</button>
                </div>
              </>
            ) : <div style={{ borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 12, fontSize: 13, color: color.ink.soft }}>Lead-supply actions are available to the Mediflow operator.</div>}
          </div>
        ) : null}
      </div>
      )}
    </AppShell>
  );
}
