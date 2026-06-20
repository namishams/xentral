"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, Input } from "@xentral/ui";

type Cfg = { agentName: string; agentTone: string; agentBusinessType: string; agentKnowledge: string; agentCustomPrompt: string; agentPlaybook: string; agentSignoff: string; openaiKeySet?: boolean };

const empty: Cfg = { agentName: "", agentTone: "", agentBusinessType: "", agentKnowledge: "", agentCustomPrompt: "", agentPlaybook: "", agentSignoff: "" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: color.ink.mid, marginBottom: 5 }}>{label}{hint ? <span style={{ color: color.ink.soft, fontWeight: 400 }}> · {hint}</span> : null}</span>
      {children}
    </label>
  );
}
const area: React.CSSProperties = { width: "100%", minHeight: 90, border: `1px solid ${color.line.strong}`, borderRadius: 9, padding: "9px 12px", fontSize: 14, color: color.ink.DEFAULT, background: color.surface.card, outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: "19px", resize: "vertical" };

export default function AiHubPage() {
  const [cfg, setCfg] = React.useState<Cfg>(empty);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [keyInput, setKeyInput] = React.useState("");

  React.useEffect(() => {
    fetch("/api/settings/ai").then(async (r) => { if (r.ok) { const d = await r.json(); setCfg({ ...empty, ...d }); } setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k: keyof Cfg) => (v: string) => setCfg((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true); setNotice("");
    try {
      const body: Record<string, unknown> = { ...cfg };
      if (keyInput.trim()) body.openaiKey = keyInput.trim();
      const r = await fetch("/api/settings/ai", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { setNotice("Saved ✓"); setKeyInput(""); if (keyInput.trim()) setCfg((c) => ({ ...c, openaiKeySet: true })); }
      else if (r.status === 503) setNotice("Activates when the workspace is live.");
      else setNotice("Could not save — please try again.");
    } catch { setNotice("Network error."); }
    setSaving(false);
  };

  return (
    <AppShell active="ai-hub">
      <PageTitleRow title="AI Hub" subtitle="Configure your WhatsApp AI assistant — persona, tone and knowledge" actions={<Button variant="primary" onClick={save} disabled={saving || loading}>{saving ? "Saving…" : "Save changes"}</Button>} />

      {notice ? <div style={{ fontSize: 13, color: notice.includes("✓") ? color.status.positive : color.ink.mid, background: color.brand.primaryTint, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 9, padding: "9px 12px", marginBottom: 14 }}>{notice}</div> : null}

      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
          <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 14 }}>Persona</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><Field label="Agent name"><Input value={cfg.agentName} onChange={(e) => set("agentName")(e.target.value)} placeholder="e.g. Sara" style={{ width: "100%" }} /></Field></div>
              <div style={{ flex: 1 }}><Field label="Tone"><Input value={cfg.agentTone} onChange={(e) => set("agentTone")(e.target.value)} placeholder="professional, warm…" style={{ width: "100%" }} /></Field></div>
            </div>
            <Field label="Business type"><Input value={cfg.agentBusinessType} onChange={(e) => set("agentBusinessType")(e.target.value)} placeholder="e.g. healthcare licensing consultancy" style={{ width: "100%" }} /></Field>
            <Field label="Sign-off" hint="how the agent closes"><Input value={cfg.agentSignoff} onChange={(e) => set("agentSignoff")(e.target.value)} placeholder="— Team Xentral" style={{ width: "100%" }} /></Field>
          </div>

          <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 14 }}>Knowledge & behaviour</div>
            <Field label="Knowledge base" hint="facts the agent may use"><textarea value={cfg.agentKnowledge} onChange={(e) => set("agentKnowledge")(e.target.value)} style={area} placeholder="Services, pricing rules, FAQs…" /></Field>
            <Field label="Playbook" hint="how to handle conversations"><textarea value={cfg.agentPlaybook} onChange={(e) => set("agentPlaybook")(e.target.value)} style={area} placeholder="Qualify, then offer a consultant call…" /></Field>
            <Field label="Custom instructions"><textarea value={cfg.agentCustomPrompt} onChange={(e) => set("agentCustomPrompt")(e.target.value)} style={{ ...area, minHeight: 70 }} placeholder="Any extra rules for the agent" /></Field>
          </div>

          <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, marginBottom: 6 }}>OpenAI key</div>
            <p style={{ fontSize: 13, color: color.ink.soft, margin: "0 0 12px" }}>{cfg.openaiKeySet ? "A key is set for this workspace. Leave blank to keep it; enter a new one to replace." : "No key set — the platform key is used as fallback. Add your own to use your account."}</p>
            <Field label="API key"><Input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder={cfg.openaiKeySet ? "•••••••••• (set)" : "sk-…"} style={{ width: "100%" }} /></Field>
            <div style={{ fontSize: 12, color: color.ink.soft, marginTop: 8, lineHeight: "17px" }}>The auto-reply itself is switched on by the platform flag <code style={{ background: color.surface.sunken, padding: "1px 5px", borderRadius: 4 }}>XENTRAL_WA_AI</code>. Per-chat you can also set a conversation to manual in the inbox.</div>
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>AI Hub · edits your workspace agent config · tenant-scoped · tokens-only</p>
    </AppShell>
  );
}
