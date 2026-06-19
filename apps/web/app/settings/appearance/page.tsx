"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, Button, StatusBadge, Panel, PanelHeader, PanelBody } from "@xentral/ui";

const PRESETS: [string, string][] = [
  ["#0064d9", "Fiori Blue"], ["#2563eb", "Royal"], ["#0891b2", "Teal"], ["#188918", "Emerald"],
  ["#7c3aed", "Violet"], ["#be185d", "Magenta"], ["#df6e0c", "Amber"], ["#cc1919", "Red"], ["#0f172a", "Graphite"],
];
function shade(h: string, mul: number) { const n = parseInt(h.slice(1), 16); const f = (x: number) => Math.max(0, Math.min(255, Math.round(x * mul))); return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function tint(h: string) { const n = parseInt(h.slice(1), 16); const f = (x: number) => Math.round(x + (255 - x) * 0.9); return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((x) => x.toString(16).padStart(2, "0")).join(""); }

function apply(accent: string) {
  const r = document.documentElement.style;
  if (/^#[0-9a-fA-F]{6}$/.test(accent)) { r.setProperty("--brand-primary", accent); r.setProperty("--brand-primary-hover", shade(accent, 0.88)); r.setProperty("--brand-tint", tint(accent)); }
}

export default function AppearancePage() {
  const [accent, setAccent] = React.useState("#0064d9");
  const [saved, setSaved] = React.useState("#0064d9");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    fetch("/api/settings/appearance").then((r) => r.json()).then((d) => { const a = d.themeAccent || "#0064d9"; setAccent(a); setSaved(a); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // live preview as you pick
  React.useEffect(() => { if (!loading) apply(accent); }, [accent, loading]);

  const dirty = accent.toLowerCase() !== saved.toLowerCase();
  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/settings/appearance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themeAccent: accent }) });
    setBusy(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error || "Save failed"); return; }
    setSaved(accent); setMsg("Theme saved — applied across the whole workspace.");
  }
  function reset() { setAccent("#0064d9"); }

  const valid = /^#[0-9a-fA-F]{6}$/.test(accent);

  return (
    <AppShell active="settings">
      <PageTitleRow title="Appearance" breadcrumb="Settings · Appearance"
        badge={<StatusBadge tone="info" label="Workspace theme" />}
        actions={dirty ? <Button variant="primary" onClick={save} disabled={busy || !valid}>{busy ? "Saving…" : "Save theme"}</Button> : <span style={{ fontSize: 12.5, fontWeight: 600, color: color.status.positive }}>{msg ? "✓ Saved" : ""}</span>} />

      {msg && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 500, color: color.status.positive, background: "#F0FDF4", border: `1px solid ${color.status.positive}33`, borderRadius: 8, padding: "9px 12px" }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <Panel>
          <PanelHeader title="Accent colour" subtitle="Re-themes buttons, links, highlights and the active nav across the whole app" />
          <PanelBody>
            {loading ? <div style={{ color: color.ink.soft, fontSize: 13 }}>Loading…</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {PRESETS.map(([hex, name]) => (
                    <button key={hex} title={name} onClick={() => setAccent(hex)} style={{ width: 40, height: 40, borderRadius: 10, background: hex, cursor: "pointer", border: accent.toLowerCase() === hex ? `3px solid ${color.ink.DEFAULT}` : `1px solid ${color.line.strong}` }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="color" value={valid ? accent : "#0064d9"} onChange={(e) => setAccent(e.target.value)} style={{ width: 44, height: 38, borderRadius: 8, border: `1px solid ${color.line.strong}`, background: "transparent", cursor: "pointer" }} />
                  <input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#0064d9" style={{ width: 140, height: 38, border: `1px solid ${valid ? color.line.strong : color.status.negative}`, borderRadius: 8, padding: "0 11px", fontSize: 13.5, fontFamily: "ui-monospace, monospace", color: color.ink.DEFAULT, background: color.surface.card, outline: "none" }} />
                  <Button onClick={reset}>Reset to default</Button>
                </div>
                <div style={{ fontSize: 11.5, color: color.ink.soft }}>Saved per workspace. Hover &amp; tint shades are derived automatically.</div>
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Live preview" subtitle="Changes apply instantly — save to keep them" />
          <PanelBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Button variant="primary">Primary button</Button>
                <Button>Secondary</Button>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ color: color.brand.primary, fontSize: 13, fontWeight: 600 }}>A themed link</a>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <StatusBadge tone="info" label="info" /><StatusBadge tone="positive" label="active" /><StatusBadge tone="neutral" label="draft" />
              </div>
              <div style={{ border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: 4, background: color.brand.primary }} />
                <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>X</span>
                  <div><div style={{ fontSize: 13.5, fontWeight: 700, color: color.ink.DEFAULT }}>Sample card</div><div style={{ fontSize: 12, color: color.ink.soft }}>Accent, tint and hover all follow your colour.</div></div>
                </div>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Appearance · workspace theme · applied app-wide on every page load</p>
    </AppShell>
  );
}
