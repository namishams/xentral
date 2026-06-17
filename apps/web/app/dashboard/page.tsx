"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, DashboardCard, PageTitleRow, KPICard } from "@xentral/ui";
import { setLocaleCore, getLocaleCore, setUpdatePort, type Locale } from "@xentral/kernel";
import { localePack } from "@xentral/locale-pack";
import { updatePack } from "@xentral/update-pack";

// Composition root: install the swappable cores once (client bundle).
setLocaleCore(localePack);
setUpdatePort(updatePack);

const KPIS = [
  { label: "Revenue MTD", value: "AED 248k", note: "▲ 12%", tone: color.status.positive },
  { label: "Outstanding", value: "AED 86k", note: "9 invoices", tone: color.status.critical },
  { label: "Open deals", value: "31", note: "AED 1.2M", tone: color.ink.mid },
  { label: "Tasks today", value: "7", note: "2 overdue", tone: color.status.negative },
];
const CHIPS = ["Draft an invoice", "This week's pipeline", "Who's overdue?", "Create a task"];

export default function DashboardPage() {
  const [locale, setLocale] = React.useState<Locale>("en");
  const loc = getLocaleCore();
  const dir = loc.direction(locale);
  const t = (k: string, fb: string) => loc.t(locale, k, fb);

  const langToggle = (
    <button onClick={() => setLocale(locale === "en" ? "ar" : "en")} style={{ height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: "#fff", fontSize: 12, cursor: "pointer", color: color.ink.DEFAULT }}>{locale === "en" ? "العربية" : "English"}</button>
  );

  return (
    <AppShell active="dashboard" headerRight={langToggle}>
      <div dir={dir}>
        <PageTitleRow
          title={t("nav.dashboard", "Mission control")}
          subtitle="Good morning, Nami · Tue 16 Jun"
          actions={<button style={{ height: 32, padding: "0 14px", borderRadius: 8, background: color.brand.primary, color: "#fff", border: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New</button>}
        />

        <section style={{ background: color.brand.primaryTint, border: `1px solid ${color.brand.primary}22`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: color.brand.primary }}>✦ Ask Xentral AI</div>
          <div style={{ fontSize: 12.5, color: color.brand.primary, opacity: 0.85, margin: "3px 0 12px" }}>Type a request or pick one — the AI takes the action.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CHIPS.map((ch) => <span key={ch} style={{ fontSize: 12, background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 999, padding: "6px 12px", color: color.ink.DEFAULT }}>{ch}</span>)}
          </div>
        </section>

        <div style={{ display: "flex", gap: uiConstants.card.gap, flexWrap: "wrap", marginBottom: 20 }}>
          {KPIS.map((k) => <KPICard key={k.label} label={k.label} value={k.value} note={k.note} noteTone={k.tone} />)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <DashboardCard size="large" title="Needs attention" className="!h-auto">
            {[["Invoice #1043 · Al Noor", "12d overdue", color.status.negative], ["Deal · Skyline Tower stalled", "8d idle", color.ink.mid], ["KYC pending · Gulf Trading", "review", color.ink.mid]].map(([a, b, t2], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "8px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
                <span style={{ color: color.ink.DEFAULT }}>{a as string}</span><span style={{ color: t2 as string }}>{b as string}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, height: 52, background: color.surface.sunken, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, color: color.ink.soft }}>Order-to-cash: leads → quotes → invoices → paid</div>
          </DashboardCard>
          <DashboardCard size="large" title="Today" className="!h-auto">
            {["10:30 · Call — Damac", "14:00 · Demo — Gulf Trading", "Send Q3 proposal"].map((x, i) => (
              <div key={i} style={{ fontSize: 12.5, padding: "7px 0", borderTop: `1px solid ${color.line.DEFAULT}`, color: color.ink.DEFAULT }}>{x}</div>
            ))}
            <div style={{ marginTop: 10, background: color.brand.primaryTint, borderRadius: 8, padding: "9px 10px", fontSize: 11.5, color: color.brand.primary }}>✦ AI insight: 3 deals likely to close this week.</div>
          </DashboardCard>
        </div>

        <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Built to docs/design/01-dashboard.md · AppShell + @xentral/ui · language via swappable locale core ({loc.id})</p>
      </div>
    </AppShell>
  );
}
