"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, Panel, PanelHeader, PanelBody } from "@xentral/ui";

type Settings = { smtpHost?: string | null; smtpPort?: number | null; smtpUser?: string | null; smtpFrom?: string | null; smtpFromName?: string | null; smtpSecure?: boolean | null; hasPass?: boolean };

export default function EmailSettingsPage() {
  const [fromName, setFromName] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("587");
  const [user, setUser] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [secure, setSecure] = React.useState(false);
  const [hasPass, setHasPass] = React.useState(false);
  const [envFallback, setEnvFallback] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/settings/email").then((r) => r.json()).then((d) => {
      const s = (d.settings || {}) as Settings;
      setFromName(s.smtpFromName || ""); setFrom(s.smtpFrom || ""); setHost(s.smtpHost || "");
      setPort(String(s.smtpPort || 587)); setUser(s.smtpUser || ""); setSecure(!!s.smtpSecure); setHasPass(!!s.hasPass);
      setEnvFallback(!!d.envFallback); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function save() {
    setBusy(true); setMsg(null);
    const body: Record<string, unknown> = { smtpFromName: fromName, smtpFrom: from, smtpHost: host, smtpPort: Number(port) || 587, smtpUser: user, smtpSecure: secure };
    if (pass) body.smtpPass = pass;
    const r = await fetch("/api/settings/email", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ kind: "err", text: d.error || "Save failed" }); return; }
    if (pass) { setHasPass(true); setPass(""); }
    setMsg({ kind: "ok", text: "Saved. Sender name and SMTP updated." });
  }

  async function sendTest() {
    setTesting(true); setMsg(null);
    const r = await fetch("/api/settings/email/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setTesting(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ kind: "err", text: d.error || "Test failed" }); return; }
    setMsg({ kind: "ok", text: `Test email sent to ${d.to} as "${d.from}".` });
  }

  const labelS: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: color.ink.soft, textTransform: "uppercase", marginBottom: 5 };
  const inS: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 36, border: `1px solid ${color.line.strong}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, color: color.ink.DEFAULT, background: color.surface.card, outline: "none" };
  const hint: React.CSSProperties = { fontSize: 11.5, color: color.ink.soft, marginTop: 4 };

  if (loading) return <AppShell active="settings"><div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div></AppShell>;

  return (
    <AppShell active="settings">
      <PageTitleRow title="Email" breadcrumb="Settings · Email"
        badge={<StatusBadge tone={host ? "positive" : envFallback ? "info" : "warning"} label={host ? "SMTP configured" : envFallback ? "Using server default" : "Not configured"} />}
        actions={<span style={{ display: "inline-flex", gap: 8 }}>
          <Button onClick={sendTest} disabled={testing || (!host && !envFallback)}>{testing ? "Sending…" : "Send test"}</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </span>} />

      {msg && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 500, color: msg.kind === "ok" ? color.status.positive : color.status.negative, background: msg.kind === "ok" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${(msg.kind === "ok" ? color.status.positive : color.status.negative)}33`, borderRadius: 8, padding: "9px 12px" }}>{msg.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Sender identity" subtitle="How outgoing emails appear to recipients" />
          <PanelBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <label style={labelS}>Sender name (From name)</label>
                <input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="e.g. Mediflow Recruitment" style={inS} />
                <div style={hint}>Shown as the display name on every email you send. Leave blank to send the address only.</div>
              </div>
              <div>
                <label style={labelS}>From email address</label>
                <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="hello@yourcompany.ae" style={inS} />
                <div style={hint}>Usually the same as your SMTP username. Replies come back here.</div>
              </div>
              <div style={{ background: color.surface.sunken, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: color.ink.mid }}>
                Preview: <strong style={{ color: color.ink.DEFAULT }}>{(fromName || "—")} &lt;{from || "address@domain"}&gt;</strong>
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="SMTP server" subtitle="Outgoing mail server credentials" />
          <PanelBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div><label style={labelS}>SMTP host</label><input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.yourprovider.com" style={inS} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelS}>Port</label><input value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" style={inS} /></div>
                <div><label style={labelS}>SSL/TLS</label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, fontSize: 13, color: color.ink.mid, cursor: "pointer" }}>
                    <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} /> Use SSL (port 465)
                  </label>
                </div>
              </div>
              <div><label style={labelS}>Username</label><input value={user} onChange={(e) => setUser(e.target.value)} placeholder="hello@yourcompany.ae" style={inS} autoComplete="off" /></div>
              <div>
                <label style={labelS}>Password</label>
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder={hasPass ? "•••••••• (unchanged)" : "SMTP password"} style={inS} autoComplete="new-password" />
                <div style={hint}>{hasPass ? "Leave blank to keep the current password." : "Stored securely for sending only."}</div>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <p style={{ fontSize: 11.5, color: color.ink.soft, marginTop: 16, lineHeight: 1.5 }}>
        These settings power quotes, invoices, campaigns and the email composer. If left empty, the workspace falls back to the platform default mail server{envFallback ? " (currently active)" : ""}. Common ports: 587 (STARTTLS) or 465 (SSL).
      </p>
    </AppShell>
  );
}
