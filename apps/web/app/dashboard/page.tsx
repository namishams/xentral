"use client";

import * as React from "react";
import { color, uiConstants, shadow } from "@xentral/config";
import { AppShell, KPICard, ActionTile } from "@xentral/ui";
import { setLocaleCore, setUpdatePort } from "@xentral/kernel";
import { localePack } from "@xentral/locale-pack";
import { updatePack } from "@xentral/update-pack";

// Composition root: install the swappable cores once (client bundle).
setLocaleCore(localePack);
setUpdatePort(updatePack);

const d = uiConstants.dashboard;

const KPIS = [
  { label: "Net order value", value: "AED 682.32k", note: "▲ AED 77.51k", tone: color.status.positive },
  { label: "Gross margin", value: "AED 222.79k", note: "▼ AED 35.12k", tone: color.status.negative },
  { label: "Orders", value: "2,189", note: "▲ 295", tone: color.status.positive },
  { label: "Avg net order", value: "AED 311.65", note: "▼ AED 7.65", tone: color.status.negative },
];

const RECOMMENDATIONS: { label: string; count: number; tone: string; href: string }[] = [
  { label: "Great! All packages have been shipped.", count: 0, tone: color.status.positive, href: "/orders" },
  { label: "Cut customer wait time — handle the open orders.", count: 4, tone: color.status.critical, href: "/orders" },
  { label: "Check your customers' open emails.", count: 1, tone: color.status.critical, href: "/email" },
  { label: "Restock items — inventory is running very low.", count: 15, tone: color.status.critical, href: "/inventory" },
];

// Launchpad — ordered by the BUSINESS LIFECYCLE, not technical modules.
// Lead → Customer → Quote → Order → Delivery → Invoice → Payment → Support.
// Admin/settings are intentionally excluded — this is "what you always need".
const SECTIONS: { title: string; tiles: { label: string; icon: string; href: string }[] }[] = [
  {
    title: "Revenue",
    tiles: [
      { label: "Leads", icon: "target", href: "/leads" },
      { label: "Contacts", icon: "user", href: "/contacts" },
      { label: "Companies", icon: "building", href: "/companies" },
      { label: "Deals", icon: "briefcase", href: "/deals" },
      { label: "Pipelines", icon: "kanban", href: "/pipelines" },
      { label: "Quotes", icon: "file", href: "/quotations" },
      { label: "Forecasting", icon: "trending", href: "/forecasting" },
    ],
  },
  {
    title: "Operations",
    tiles: [
      { label: "Orders", icon: "cart", href: "/orders" },
      { label: "Products", icon: "package", href: "/products" },
      { label: "Inventory", icon: "layers", href: "/inventory" },
      { label: "Warehouses", icon: "building", href: "/warehouses" },
      { label: "Procurement", icon: "cart", href: "/procurement" },
      { label: "Suppliers", icon: "truck", href: "/suppliers" },
      { label: "Projects", icon: "clipboard", href: "/projects" },
    ],
  },
  {
    title: "Finance",
    tiles: [
      { label: "Invoices", icon: "receipt", href: "/invoices" },
      { label: "Payments", icon: "card", href: "/payments" },
      { label: "Receivables", icon: "landmark", href: "/receivables" },
      { label: "Payables", icon: "landmark", href: "/payables" },
      { label: "VAT", icon: "percent", href: "/vat" },
      { label: "Reports", icon: "chart", href: "/reports" },
    ],
  },
  {
    title: "Communication",
    tiles: [
      { label: "WhatsApp", icon: "message", href: "/inbox" },
      { label: "Email", icon: "mail", href: "/email" },
      { label: "Calls", icon: "phone", href: "/calls" },
      { label: "Meetings", icon: "calendar", href: "/meetings" },
      { label: "Campaigns", icon: "megaphone", href: "/campaigns" },
    ],
  },
];

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: d.panel.radius, padding: d.panel.padding, boxShadow: shadow.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: d.panel.titleFontSize, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const focus = RECOMMENDATIONS.filter((r) => r.count > 0).slice().sort((a, b) => b.count - a.count)[0];
  return (
    <AppShell active="dashboard">
      {/* Greeting */}
      <div style={{ marginBottom: d.greeting.marginBottom }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: d.greeting.titleFontSize, fontWeight: 600, color: color.ink.DEFAULT }}>Good evening, Nami</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: color.brand.primary, background: color.brand.primaryTint, borderRadius: 6, padding: "2px 8px" }}>PRO</span>
        </div>
        <div style={{ fontSize: d.greeting.subFontSize, color: color.ink.mid, marginTop: 2 }}>Take a look at this month's performance</div>
      </div>

      {/* Today's focus — the one hero: what needs attention right now */}
      {focus ? (
        <a href={focus.href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, textDecoration: "none", marginBottom: d.panel.gap }}>
          <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.brand.primary }}>Today&rsquo;s focus</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{focus.label}</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: focus.tone, padding: "4px 11px", borderRadius: 8, background: color.surface.sunken, flexShrink: 0 }}>{focus.count}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 8, background: color.brand.primary, color: color.ink.onPrimary, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Resolve<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></span>
        </a>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 12, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, marginBottom: d.panel.gap }}>
          <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDF4", color: color.status.positive, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
          </span>
          <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: color.status.positive }}>Today&rsquo;s focus</div><div style={{ fontSize: 16, fontWeight: 700, color: color.ink.DEFAULT, marginTop: 1 }}>You&rsquo;re all caught up — nothing needs attention right now.</div></div>
        </div>
      )}

      {/* KPI row — 4 identical locked tiles */}
      <div style={{ display: "flex", gap: uiConstants.card.gap, flexWrap: "wrap", marginBottom: d.panel.gap }}>
        {KPIS.map((k) => <KPICard key={k.label} label={k.label} value={k.value} note={k.note} noteTone={k.tone} />)}
      </div>

      {/* Recommendations + Bookmarks */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: d.panel.gap, alignItems: "start" }}>
        <Panel title="Recommendations">
          <div>
            {RECOMMENDATIONS.map((r, i) => (
              <a key={i} href={r.href} style={{ display: "flex", alignItems: "center", gap: 12, height: d.recommendation.rowHeight, borderTop: i === 0 ? "none" : `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
                <span style={{ width: d.recommendation.accentWidth, height: 22, borderRadius: 2, background: r.tone, flexShrink: 0 }} />
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: color.line.strong, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: d.recommendation.fontSize, color: color.ink.DEFAULT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                <span style={{ fontSize: d.recommendation.countFontSize, fontWeight: 600, color: r.count > 0 ? color.ink.DEFAULT : color.ink.soft }}>{r.count}</span>
              </a>
            ))}
          </div>
        </Panel>

        <Panel title="My bookmarks" action={<span style={{ fontSize: 16, color: color.ink.soft }} aria-hidden="true">⚙</span>}>
          <p style={{ fontSize: 13, color: color.ink.mid, margin: "0 0 16px" }}>Create your first bookmark to speed up your daily work.</p>
          <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px", border: `1px solid ${color.line.strong}`, borderRadius: 8, fontSize: 13, color: color.ink.DEFAULT, textDecoration: "none" }}>+ Add bookmark</a>
        </Panel>
      </div>

      {/* Module sections — identical action tiles */}
      {SECTIONS.map((s) => (
        <div key={s.title}>
          <h2 style={{ fontSize: d.section.titleFontSize, fontWeight: 600, color: color.ink.DEFAULT, margin: `${d.section.marginTop}px 0 ${d.section.marginBottom}px`, borderBottom: `1px solid ${color.line.DEFAULT}`, paddingBottom: 8 }}>{s.title}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: d.actionTile.gap }}>
            {s.tiles.map((t) => <ActionTile key={t.label} label={t.label} icon={t.icon} href={t.href} />)}
          </div>
        </div>
      ))}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 28 }}>Home dashboard · every tile dimensioned from @xentral/config (ui-constants.dashboard) · locked components only</p>
    </AppShell>
  );
}
