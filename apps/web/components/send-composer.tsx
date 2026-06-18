"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { Button } from "@xentral/ui";

type Prefill = { to: string; cc?: string; subject: string; message: string; customer?: string; hasEmail?: boolean; phone?: string; publicUrl?: string; waMessage?: string; error?: string };

export function SendComposer({ kind, id, docNumber, onClose, onSent }: {
  kind: "invoice" | "quote"; id: string; docNumber?: string; onClose: () => void; onSent?: (to: string) => void;
}) {
  const api = kind === "invoice" ? "invoices" : "quotes";
  const noun = kind === "invoice" ? "invoice" : "offer";
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [to, setTo] = React.useState("");
  const [cc, setCc] = React.useState("");
  const [bcc, setBcc] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sendCopy, setSendCopy] = React.useState(false);
  const [showCc, setShowCc] = React.useState(false);
  const [channel, setChannel] = React.useState<"email" | "whatsapp">("email");
  const [phone, setPhone] = React.useState("");
  const [waMsg, setWaMsg] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/books/${api}/${id}/send`).then((r) => r.json()).then((d: Prefill) => {
      if (d.error) setErr(d.error);
      setTo(d.to || ""); setCc(d.cc || ""); setSubject(d.subject || ""); setMessage(d.message || "");
      setPhone(d.phone || ""); setWaMsg(d.waMessage || "");
      setLoading(false);
    }).catch(() => { setErr("Could not load."); setLoading(false); });
  }, [api, id]);

  function openWhatsApp() {
    const num = phone.replace(/[^\d]/g, "");
    if (!num) { setErr("No WhatsApp number — add a phone on the customer."); return; }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(waMsg)}`, "_blank");
    onSent?.(phone); onClose();
  }

  async function send() {
    if (!to.trim()) { setErr("Enter a recipient email."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/books/${api}/${id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: to.trim(), cc: cc.trim(), bcc: bcc.trim(), subject, message, sendCopy }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { onSent?.(d.to || to); onClose(); }
      else { setErr(d.error || "Could not send."); setBusy(false); }
    } catch { setErr("Network error."); setBusy(false); }
  }

  const label: React.CSSProperties = { width: 64, flexShrink: 0, fontSize: 12, fontWeight: 600, color: color.ink.soft, paddingTop: 9 };
  const field: React.CSSProperties = { flex: 1, minWidth: 0, height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box" };
  const row: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${color.line.DEFAULT}` };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 120, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", background: color.surface.card, borderRadius: 16, boxShadow: "0 24px 60px -16px rgba(20,28,38,0.45)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
          <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: color.ink.DEFAULT }}>Email {noun}{docNumber ? ` ${docNumber}` : ""}</h2>
          <button aria-label="Close" onClick={onClose} style={{ border: 0, background: "transparent", fontSize: 20, color: color.ink.soft, cursor: "pointer" }}>×</button>
        </div>

        {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div> : (
          <div style={{ padding: "6px 18px 0", overflowY: "auto" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              {(["email", "whatsapp"] as const).map((c) => { const on = channel === c; return <button key={c} onClick={() => { setErr(""); setChannel(c); }} style={{ flex: 1, height: 32, borderRadius: 8, border: `1px solid ${on ? color.brand.primary : color.line.strong}`, background: on ? color.brand.primaryTint : color.surface.card, color: on ? color.brand.primary : color.ink.mid, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>{c === "email" ? "✉ Email" : "✆ WhatsApp"}</button>; })}
            </div>
            {channel === "whatsapp" ? (
              <div>
                <div style={row}><span style={label}>To</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9715XXXXXXXX" style={field} /></div>
                <div style={{ padding: "12px 0" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: color.ink.soft }}>Message</span>
                  <textarea value={waMsg} onChange={(e) => setWaMsg(e.target.value)} rows={6} style={{ width: "100%", boxSizing: "border-box", marginTop: 6, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, lineHeight: 1.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: color.surface.sunken, borderRadius: 8, fontSize: 12.5, color: color.ink.mid }}><span aria-hidden>🔗</span> Opens WhatsApp with the message and a secure link to the {noun}.</div>
                {err ? <div style={{ marginTop: 10, fontSize: 12.5, color: color.status.critical }}>{err}</div> : null}
              </div>
            ) : (<>
            <div style={row}>
              <span style={label}>To</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="customer@email.com" style={field} />
                {!showCc ? <button onClick={() => setShowCc(true)} style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, color: color.brand.primary, background: "transparent", border: 0, cursor: "pointer", padding: 0 }}>+ Cc / Bcc</button> : null}
              </div>
            </div>
            {showCc ? (
              <>
                <div style={row}><span style={label}>Cc</span><input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="comma-separated" style={field} /></div>
                <div style={row}><span style={label}>Bcc</span><input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="comma-separated" style={field} /></div>
              </>
            ) : null}
            <div style={row}><span style={label}>Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} style={field} /></div>
            <div style={{ padding: "12px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: color.ink.soft }}>Message</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7} style={{ width: "100%", boxSizing: "border-box", marginTop: 6, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, lineHeight: 1.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: color.surface.sunken, borderRadius: 8, fontSize: 12.5, color: color.ink.mid }}>
              <span aria-hidden>📎</span> The {noun} PDF{docNumber ? ` (${docNumber}.pdf)` : ""} is attached automatically{kind === "invoice" ? ", with a secure pay button" : " and an online accept link"}.
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12.5, color: color.ink.mid, cursor: "pointer" }}>
              <input type="checkbox" checked={sendCopy} onChange={(e) => setSendCopy(e.target.checked)} /> Send a copy to my mailbox
            </label>
            {err ? <div style={{ marginTop: 10, fontSize: 12.5, color: color.status.critical, background: `color-mix(in srgb, ${color.status.critical} 10%, ${color.surface.card})`, border: `1px solid ${color.status.critical}`, borderRadius: 8, padding: "8px 11px" }}>{err}</div> : null}
            </>)}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: `1px solid ${color.line.DEFAULT}`, marginTop: "auto" }}>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={channel === "whatsapp" ? openWhatsApp : send} disabled={busy || loading || (channel === "email" ? !to.trim() : !phone.trim())}>{channel === "whatsapp" ? "Open WhatsApp" : (busy ? "Sending…" : "Send")}</Button>
        </div>
      </div>
    </div>
  );
}
