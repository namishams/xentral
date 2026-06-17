"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input, StatusBadge, type BadgeTone } from "@xentral/ui";

type Mail = { id: string; subject: string; to: string; toName: string | null; from: string; status: string; body: string; sent: string };
const initials = (s: string) => (s || "?").split(/[ @.]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const TONE: Record<string, BadgeTone> = { SENT: "positive", FAILED: "critical", QUEUED: "warning" };

export default function EmailPage() {
  const [rows, setRows] = React.useState<Mail[]>([]);
  const [configured, setConfigured] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [sel, setSel] = React.useState<Mail | null>(null);
  const [compose, setCompose] = React.useState(false);
  const [draft, setDraft] = React.useState({ to: "", toName: "", subject: "", body: "" });
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/email/messages").then((r) => r.json()).then((d) => { setRows(d.rows ?? []); setConfigured(d.configured !== false); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function send() {
    if (!draft.to.trim() || !draft.subject.trim()) { setErr("Recipient and subject are required"); return; }
    setSending(true); setErr("");
    try {
      const res = await fetch("/api/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const d = await res.json();
      if (res.ok) { setCompose(false); setDraft({ to: "", toName: "", subject: "", body: "" }); load(); }
      else setErr(d.error || "Could not send");
    } catch { setErr("Network error"); } finally { setSending(false); }
  }

  return (
    <AppShell active="email">
      <PageTitleRow title="Email" subtitle={`${rows.length} sent`} actions={<Button variant="primary" onClick={() => { setErr(""); setCompose(true); }}>＋ Compose</Button>} />

      {!configured ? (
        <div style={{ background: "color-mix(in srgb, #9a5800 12%, " + color.surface.card + ")", border: `1px solid ${color.line.strong}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: color.ink.mid, marginBottom: 14 }}>
          No mailbox connected yet. Add SMTP details in <b>Settings → Email</b> to start sending. You can still compose to preview.
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 16, alignItems: "start" }}>
        <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "11px 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 12, fontWeight: 700, color: color.ink.soft, textTransform: "uppercase", letterSpacing: 0.4 }}>Sent</div>
          {loading ? <div style={{ padding: 24, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
            : rows.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>No emails yet. Compose your first message.</div>
              : rows.map((m) => {
                const on = sel?.id === m.id;
                return (
                  <button key={m.id} onClick={() => setSel(m)} style={{ width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 14px", border: 0, borderBottom: `1px solid ${color.line.DEFAULT}`, background: on ? color.surface.sunken : color.surface.card, cursor: "pointer" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(m.toName || m.to)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.toName || m.to}</span><span style={{ fontSize: 11, color: color.ink.soft, flexShrink: 0 }}>{m.sent}</span></span>
                      <span style={{ display: "block", fontSize: 12.5, color: color.ink.mid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.subject}</span>
                    </span>
                  </button>
                );
              })}
        </div>

        <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 22, minHeight: 320 }}>
          {sel ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: color.ink.DEFAULT }}>{sel.subject}</h2>
                <StatusBadge tone={TONE[sel.status] ?? "neutral"} label={sel.status.toLowerCase()} />
              </div>
              <div style={{ fontSize: 12.5, color: color.ink.soft, marginBottom: 4 }}>To: {sel.toName ? `${sel.toName} · ` : ""}{sel.to}</div>
              <div style={{ fontSize: 12.5, color: color.ink.soft, marginBottom: 16 }}>From: {sel.from} · {sel.sent}</div>
              <div style={{ fontSize: 14, color: color.ink.DEFAULT, lineHeight: 1.6, whiteSpace: "pre-wrap", borderTop: `1px solid ${color.line.DEFAULT}`, paddingTop: 16 }}>{sel.body || "(no body)"}</div>
            </>
          ) : (
            <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: color.ink.soft, textAlign: "center" }}>
              <span style={{ fontSize: 34, marginBottom: 10 }}>✉</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: color.ink.mid }}>Select a message</div>
              <div style={{ fontSize: 13 }}>or compose a new email to a customer or lead.</div>
            </div>
          )}
        </div>
      </div>

      {compose ? (
        <div onClick={() => !sending && setCompose(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: color.surface.card, borderRadius: 14, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.4)", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: color.ink.DEFAULT }}>New email</h2>
              <button aria-label="Close" onClick={() => setCompose(false)} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
            </div>
            {err ? <div style={{ background: "#fdeceb", color: "#b3261e", border: "1px solid #f3b6b1", borderRadius: 8, padding: "8px 11px", fontSize: 12.5, marginBottom: 12 }}>{err}</div> : null}
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <Input placeholder="To (email)" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} style={{ flex: 1.4 }} />
              <Input placeholder="Name (optional)" value={draft.toName} onChange={(e) => setDraft({ ...draft, toName: e.target.value })} style={{ flex: 1 }} />
            </div>
            <Input placeholder="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} style={{ width: "100%", marginBottom: 10 }} />
            <textarea placeholder="Write your message…" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={8} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: 12, fontSize: 14, fontFamily: "inherit", color: color.ink.DEFAULT, background: color.surface.card, resize: "vertical", marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setCompose(false)} disabled={sending}>Cancel</Button>
              <Button variant="primary" onClick={send} disabled={sending}>{sending ? "Sending…" : "Send email"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
