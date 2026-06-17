"use client";

import * as React from "react";
import { colorLight, colorDark, pipeline } from "@xentral/config";

const aed = (n: number) => `AED ${n.toLocaleString()}`;

const NAV = [
  { g: "Mission Control", items: ["Dashboard", "Ask Xentral AI", "Work queue"] },
  { g: "Revenue", items: ["Leads", "Deals", "Pipelines"] },
  { g: "Finance", items: ["Invoices", "VAT", "Reports"] },
];
const ROWS = [
  { name: "Skyline Tower fit-out", acct: "Skyline", stage: "proposal" as const, val: 480000 },
  { name: "Office relocation", acct: "Gulf Trading", stage: "qualified" as const, val: 120000 },
  { name: "Brokerage retainer", acct: "Al Noor", stage: "won" as const, val: 90000 },
  { name: "Mall units", acct: "Emaar", stage: "lost" as const, val: 310000 },
];

export default function ThemePreviewPage() {
  const [dark, setDark] = React.useState(true);
  const c = dark ? colorDark : colorLight;

  const KPI = ({ label, value, note, tone }: { label: string; value: string; note: string; tone?: string }) => (
    <div style={{ flex: 1, minWidth: 180, height: 96, background: c.surface.card, border: `1px solid ${c.line.DEFAULT}`, borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 12, color: c.ink.mid }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.ink.DEFAULT, lineHeight: "28px" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: tone ?? c.ink.soft }}>{note}</div>
    </div>
  );
  const Stage = ({ s }: { s: keyof typeof pipeline }) => {
    const t = pipeline[s];
    return <span style={{ fontSize: 11, fontWeight: 600, background: t.bg, color: t.fg, borderRadius: 999, padding: "2px 10px", textTransform: "capitalize" }}>{s}</span>;
  };
  const Badge = ({ label, bg, fg }: { label: string; bg: string; fg: string }) => <span style={{ fontSize: 11, fontWeight: 600, background: bg, color: fg, borderRadius: 999, padding: "2px 10px" }}>{label}</span>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: c.surface.page, color: c.ink.DEFAULT, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", transition: "background 160ms" }}>
      {/* Sidebar */}
      <aside style={{ width: 230, flexShrink: 0, background: c.shell.bar, borderRight: `1px solid ${c.line.DEFAULT}`, padding: "16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 18px 16px" }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: c.brand.primary, color: c.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: dark ? c.ink.DEFAULT : "#fff" }}>Xentral</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: c.brand.primary, background: c.brand.primaryTint, borderRadius: 5, padding: "1px 6px" }}>{dark ? "NIGHT" : "DAY"}</span>
        </div>
        {NAV.map((sec) => (
          <div key={sec.g} style={{ padding: "8px 0" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: dark ? c.ink.soft : "#aab8c6", padding: "0 18px 6px" }}>{sec.g}</div>
            {sec.items.map((it, i) => {
              const on = sec.g === "Revenue" && i === 1;
              const txt = dark ? (on ? c.brand.primary : c.ink.mid) : (on ? "#fff" : "#c9d4de");
              return <div key={it} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", fontSize: 13.5, color: txt, background: on ? (dark ? c.brand.primaryTint : "rgba(255,255,255,0.12)") : "transparent", fontWeight: on ? 600 : 400 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: on ? c.brand.primary : c.line.strong }} />{it}</div>;
            })}
          </div>
        ))}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 56, flexShrink: 0, background: c.shell.alt, borderBottom: `1px solid ${c.line.DEFAULT}`, display: "flex", alignItems: "center", gap: 12, padding: "0 22px" }}>
          <div style={{ flex: 1, maxWidth: 420, height: 34, background: dark ? c.surface.sunken : "rgba(255,255,255,0.16)", border: `1px solid ${dark ? c.line.DEFAULT : "rgba(255,255,255,0.25)"}`, borderRadius: 8, display: "flex", alignItems: "center", padding: "0 12px", color: dark ? c.ink.soft : "#dbe4ec", fontSize: 13 }}>Search leads, contacts, deals…</div>
          <button onClick={() => setDark((v) => !v)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#fff", background: c.brand.primary, border: 0, borderRadius: 8, padding: "7px 14px" }}>{dark ? "☀ Switch to Light" : "☾ Switch to Dark"}</button>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: c.brand.primary, color: c.ink.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>MF</span>
        </header>

        <main style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 2, color: c.ink.DEFAULT }}>Good evening, Nami</div>
          <div style={{ fontSize: 13, color: c.ink.mid, marginBottom: 18 }}>{dark ? "Dark Night theme" : "Light Day theme"} — SAP Fiori Horizon palette · toggle top-right</div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <KPI label="Net order value" value="AED 682.3k" note="▲ AED 77.5k" tone={c.status.positive} />
            <KPI label="Gross margin" value="AED 222.8k" note="▼ AED 35.1k" tone={c.status.negative} />
            <KPI label="Orders" value="2,189" note="▲ 295" tone={c.status.positive} />
            <KPI label="Balance due" value="AED 13.2k" note="due to FTA" tone={c.status.critical} />
          </div>

          <section style={{ background: c.surface.card, border: `1px solid ${c.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: c.ink.DEFAULT }}>Deals</h2>
              <span style={{ fontSize: 12, fontWeight: 600, background: c.brand.primary, color: "#fff", borderRadius: 8, padding: "6px 12px" }}>+ New deal</span>
            </div>
            <div>
              <div style={{ display: "flex", fontSize: 11.5, color: c.ink.soft, padding: "0 0 8px", borderBottom: `1px solid ${c.line.DEFAULT}` }}>
                <span style={{ flex: 2 }}>Deal</span><span style={{ flex: 1 }}>Account</span><span style={{ width: 120 }}>Stage</span><span style={{ width: 110, textAlign: "right" }}>Value</span>
              </div>
              {ROWS.map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${c.line.DEFAULT}`, fontSize: 13.5 }}>
                  <span style={{ flex: 2, fontWeight: 600, color: c.ink.DEFAULT }}>{r.name}</span>
                  <span style={{ flex: 1, color: c.ink.mid }}>{r.acct}</span>
                  <span style={{ width: 120 }}><Stage s={r.stage} /></span>
                  <span style={{ width: 110, textAlign: "right", fontWeight: 600, color: c.ink.DEFAULT }}>{aed(r.val)}</span>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <section style={{ flex: 1, minWidth: 280, background: c.surface.card, border: `1px solid ${c.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: c.ink.DEFAULT }}>Status & stages</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge label="positive" bg={c.status.positive + "22"} fg={c.status.positive} />
                <Badge label="info" bg={c.status.info + "22"} fg={c.status.info} />
                <Badge label="warning" bg={c.status.critical + "22"} fg={c.status.critical} />
                <Badge label="critical" bg={c.status.negative + "22"} fg={c.status.negative} />
                <Badge label="neutral" bg={c.surface.sunken} fg={c.ink.mid} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <Stage s="new" /><Stage s="qualified" /><Stage s="proposal" /><Stage s="negotiation" /><Stage s="won" />
              </div>
            </section>
            <section style={{ flex: 1, minWidth: 280, background: c.brand.primaryTint, border: `1px solid ${c.brand.primary}55`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: c.brand.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>✦</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: c.brand.primary }}>Ask Xentral AI</span>
              </div>
              <div style={{ fontSize: 13, color: c.ink.mid }}>Two customers are overdue. Al Noor owes AED 9,500 — want me to send a reminder?</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, background: c.brand.primary, color: "#fff", borderRadius: 8, padding: "7px 13px" }}>Send reminder</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, background: "transparent", color: c.ink.DEFAULT, border: `1px solid ${c.line.strong}`, borderRadius: 8, padding: "7px 13px" }}>Dismiss</span>
              </div>
            </section>
          </div>

          <p style={{ fontSize: 11, color: c.ink.soft, textAlign: "center", marginTop: 24 }}>Theme A/B preview · same token shape (color ⇄ colorDark) → a global toggle is one swap · pipeline pastels shared</p>
        </main>
      </div>
    </div>
  );
}
