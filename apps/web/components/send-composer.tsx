"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { Button } from "@xentral/ui";

type Prefill = { to: string; cc?: string; subject: string; message: string; customer?: string; hasEmail?: boolean; phone?: string; publicUrl?: string; waMessage?: string; error?: string };

const WA = "#25D366";

export function SendComposer({ kind, id, docNumber, onClose, onSent }: {
  kind: "invoice" | "quote"; id: string; docNumber?: string; onClose: () => void; onSent?: (to: string) => void;
}) {
  const api = kind === "invoice" ? "invoices" : "quotes";
  const noun = kind === "invoice" ? "invoice" : "offer";
  const Noun = kind === "invoice" ? "Invoice" : "Offer";

  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [channel, setChannel] = React.useState<"email" | "whatsapp">("email");

  const [to, setTo] = React.useState("");
  const [cc, setCc] = React.useState("");
  const [bcc, setBcc] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sendCopy, setSendCopy] = React.useState(false);
  const [attachStatement, setAttachStatement] = React.useState(false);
  const [showCc, setShowCc] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const [phone, setPhone] = React.useState("");
  const [waMsg, setWaMsg] = React.useState("");

  const [customer, setCustomer] = React.useState("");
  const [publicUrl, setPublicUrl] = React.useState("");
  const baseRef = React.useRef<{ subject: string; message: string; wa: string }>({ subject: "", message: "", wa: "" });

  React.useEffect(() => {
    fetch(`/api/books/${api}/${id}/send`).then((r) => r.json()).then((d: Prefill) => {
      if (d.error) setErr(d.error);
      setTo(d.to || ""); setCc(d.cc || ""); setSubject(d.subject || ""); setMessage(d.message || "");
      setPhone(d.phone || ""); setWaMsg(d.waMessage || ""); setCustomer(d.customer || ""); setPublicUrl(d.publicUrl || "");
      baseRef.current = { subject: d.subject || "", message: d.message || "", wa: d.waMessage || "" };
      setLoading(false);
    }).catch(() => { setErr("Could not load."); setLoading(false); });
  }, [api, id]);

  const cust = customer || "customer";
  const num = docNumber || "";
  const emailTemplates = [
    { key: "standard", label: "Standard", subject: baseRef.current.subject, message: baseRef.current.message },
    { key: "reminder", label: "Reminder", subject: `Reminder: ${Noun} ${num}`, message: `Dear ${cust},\n\nThis is a friendly reminder regarding ${noun} ${num}, attached for your reference. If payment is already on its way, thank you — please disregard this note.\n\nBest regards,` },
    { key: "thanks", label: "Thank you", subject: `Thank you — ${Noun} ${num}`, message: `Dear ${cust},\n\nThank you for your business. Please find ${noun} ${num} attached for your records. It was a pleasure working with you.\n\nWarm regards,` },
  ];
  const waTemplates = [
    { label: "Standard", text: baseRef.current.wa },
    { label: "Reminder", text: `Hi ${customer || ""}, a friendly reminder about ${noun} ${num}: ${publicUrl}` },
    { label: "Thank you", text: `Hi ${customer || ""}, thank you! Here is ${noun} ${num}: ${publicUrl}` },
  ];

  async function send() {
    if (!to.trim()) { setErr("Enter a recipient email."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/books/${api}/${id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: to.trim(), cc: cc.trim(), bcc: bcc.trim(), subject, message, sendCopy, attachStatement }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { onSent?.(d.to || to); onClose(); }
      else { setErr(d.error || "Could not send."); setBusy(false); }
    } catch { setErr("Network error."); setBusy(false); }
  }
  function openWhatsApp() {
    const n = phone.replace(/[^\d]/g, "");
    if (!n) { setErr("No WhatsApp number — add a phone on the customer."); return; }
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(waMsg)}`, "_blank");
    onSent?.(phone); onClose();
  }

  const label: React.CSSProperties = { width: 58, flexShrink: 0, fontSize: 12, fontWeight: 600, color: color.ink.soft, paddingTop: 9 };
  const field: React.CSSProperties = { flex: 1, minWidth: 0, height: 34, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box" };
  const row: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${color.line.DEFAULT}` };
  const ta: React.CSSProperties = { width: "100%", boxSizing: "border-box", marginTop: 6, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: 10, fontSize: 13, lineHeight: 1.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", resize: "vertical", fontFamily: "inherit" };
  const chip = (active: boolean): React.CSSProperties => ({ fontSize: 11.5, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${active ? color.brand.primary : color.line.strong}`, background: active ? color.brand.primaryTint : color.surface.card, color: active ? color.brand.primary : color.ink.mid });
  const fileChip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: 8, background: color.surface.sunken, border: `1px solid ${color.line.DEFAULT}`, fontSize: 12, color: color.ink.DEFAULT };

  const subjectMatchesTpl = (t: { subject: string; message: string }) => subject === t.subject && message === t.message;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 120, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", background: color.surface.card, borderRadius: 18, boxShadow: "0 28px 70px -18px rgba(20,28,38,0.5)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: channel === "whatsapp" ? "linear-gradient(90deg, rgba(37,211,102,0.10), transparent)" : "linear-gradient(90deg, rgba(0,100,217,0.08), transparent)" }}>
          <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: channel === "whatsapp" ? "rgba(37,211,102,0.15)" : color.brand.primaryTint, color: channel === "whatsapp" ? WA : color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: color.ink.DEFAULT }}>Send {noun}{num ? ` ${num}` : ""}</div>
            <div style={{ fontSize: 12, color: color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer ? `to ${customer}` : "Choose a channel and review before sending"}</div>
          </div>
          <button aria-label="Close" onClick={onClose} style={{ border: 0, background: "transparent", fontSize: 22, color: color.ink.soft, cursor: "pointer" }}>×</button>
        </div>

        {/* Channel switcher */}
        <div style={{ display: "flex", gap: 8, padding: "12px 20px 0" }}>
          {([["email", "✉", "Email"], ["whatsapp", "✆", "WhatsApp"]] as const).map(([c, ic, lab]) => { const on = channel === c; const tint = c === "whatsapp" ? WA : color.brand.primary; return (
            <button key={c} onClick={() => { setErr(""); setChannel(c); }} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 40, borderRadius: 10, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: `1.5px solid ${on ? tint : color.line.strong}`, background: on ? (c === "whatsapp" ? "rgba(37,211,102,0.10)" : color.brand.primaryTint) : color.surface.card, color: on ? tint : color.ink.mid }}><span style={{ fontSize: 15 }}>{ic}</span> {lab}</button>
          ); })}
        </div>

        {loading ? <div style={{ padding: 48, textAlign: "center", color: color.ink.soft }}>Loading…</div> : (
          <div style={{ padding: "14px 20px 0", overflowY: "auto" }}>
            {channel === "email" ? (
              <>
                {/* Templates */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: color.ink.soft }}>Template:</span>
                  {emailTemplates.map((t) => <button key={t.key} onClick={() => { setSubject(t.subject); setMessage(t.message); }} style={chip(subjectMatchesTpl(t))}>{t.label}</button>)}
                </div>
                <div style={row}>
                  <span style={label}>To</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="customer@email.com" style={field} />
                    {!showCc ? <button onClick={() => setShowCc(true)} style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, color: color.brand.primary, background: "transparent", border: 0, cursor: "pointer", padding: 0 }}>+ Cc / Bcc</button> : null}
                  </div>
                </div>
                {showCc ? (<>
                  <div style={row}><span style={label}>Cc</span><input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="comma-separated" style={field} /></div>
                  <div style={row}><span style={label}>Bcc</span><input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="comma-separated" style={field} /></div>
                </>) : null}
                <div style={row}><span style={label}>Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} style={field} /></div>
                <div style={{ padding: "12px 0" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: color.ink.soft }}>Message</span>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} style={ta} />
                </div>

                {/* Attachments */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: color.ink.soft, marginBottom: 6 }}>Attachments</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={fileChip}><span aria-hidden style={{ color: color.status.negative }}>▣</span> {num ? `${num}.pdf` : `${Noun}.pdf`}</span>
                    {attachStatement ? <span style={fileChip}><span aria-hidden style={{ color: color.status.negative }}>▣</span> Account statement <button onClick={() => setAttachStatement(false)} aria-label="Remove" style={{ border: 0, background: "transparent", color: color.ink.soft, cursor: "pointer", fontSize: 14, padding: 0, marginLeft: 2 }}>×</button></span> : null}
                    {kind === "invoice" && !attachStatement ? <button onClick={() => setAttachStatement(true)} style={{ ...fileChip, cursor: "pointer", color: color.brand.primary, borderStyle: "dashed" }}>+ Account statement</button> : null}
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: color.ink.mid, cursor: "pointer" }}>
                  <input type="checkbox" checked={sendCopy} onChange={(e) => setSendCopy(e.target.checked)} /> Send a copy to my mailbox
                </label>

                {/* Preview */}
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setShowPreview((v) => !v)} style={{ fontSize: 12, fontWeight: 600, color: color.brand.primary, background: "transparent", border: 0, cursor: "pointer", padding: 0 }}>{showPreview ? "▾ Hide preview" : "▸ Preview email"}</button>
                  {showPreview ? (
                    <div style={{ marginTop: 8, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ height: 6, background: color.brand.primary }} />
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 12.5, color: "#1d2733", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{message || "(your message)"}</div>
                        <div style={{ background: "#f6f9fb", border: "1px solid #e4e9ef", borderRadius: 10, padding: 14, margin: "14px 0" }}>
                          <div style={{ fontSize: 11.5, color: "#5b6b7b" }}>{kind === "invoice" ? "Amount due" : "Quotation"} · {num}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: color.ink.DEFAULT, marginTop: 2 }}>📎 {num}.pdf attached</div>
                        </div>
                        <span style={{ display: "inline-block", background: color.brand.primary, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 9 }}>{kind === "invoice" ? "Pay securely" : "View & accept"}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {err ? <div style={{ marginTop: 12, fontSize: 12.5, color: color.status.critical, background: `color-mix(in srgb, ${color.status.critical} 10%, ${color.surface.card})`, border: `1px solid ${color.status.critical}`, borderRadius: 8, padding: "8px 11px" }}>{err}</div> : null}
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: color.ink.soft }}>Template:</span>
                  {waTemplates.map((t) => <button key={t.label} onClick={() => setWaMsg(t.text)} style={{ ...chip(waMsg === t.text), borderColor: waMsg === t.text ? WA : color.line.strong, background: waMsg === t.text ? "rgba(37,211,102,0.10)" : color.surface.card, color: waMsg === t.text ? "#0b7a3b" : color.ink.mid }}>{t.label}</button>)}
                </div>
                <div style={row}><span style={label}>To</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9715XXXXXXXX" style={field} /></div>
                <div style={{ padding: "12px 0" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: color.ink.soft }}>Message</span>
                  <textarea value={waMsg} onChange={(e) => setWaMsg(e.target.value)} rows={6} style={ta} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, fontSize: 12.5, color: "#0b7a3b" }}>
                  <span aria-hidden>🔗</span> A secure link to the {noun} is included — the customer opens it to view{kind === "invoice" ? " & pay" : " & accept"}.
                </div>
                {err ? <div style={{ marginTop: 12, fontSize: 12.5, color: color.status.critical }}>{err}</div> : null}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: `1px solid ${color.line.DEFAULT}`, marginTop: "auto" }}>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          {channel === "whatsapp" ? (
            <button onClick={openWhatsApp} disabled={loading || !phone.trim()} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 18px", borderRadius: 9, border: 0, fontWeight: 700, fontSize: 13.5, cursor: loading || !phone.trim() ? "default" : "pointer", opacity: loading || !phone.trim() ? 0.5 : 1, background: WA, color: "#fff" }}>✆ Open WhatsApp</button>
          ) : (
            <Button variant="primary" onClick={send} disabled={busy || loading || !to.trim()}>{busy ? "Sending…" : "Send email"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
