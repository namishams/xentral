import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { PageContainer } from "./page-container";

/**
 * NAV — the locked navigation map. Grouped by platform layer:
 *  • Core  — Layer 1 (Identity, AI OS, Communication Hub, Timeline, Mission Control)
 *  • CRM   — Layer 2 (the mandatory CRM core)
 *  • Business — Layer 3 preview (Finance / Inventory routes already migrated)
 * `id` matches each page's <AppShell active="…">; `href` is the live route.
 */
type NavItem = { id: string; label: string; href: string; glyph: string };
type NavGroup = { group: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    group: "Core",
    items: [
      { id: "dashboard", label: "Mission Control", href: "/dashboard", glyph: "◷" },
      { id: "ai", label: "Ask Xentral AI", href: "/ai", glyph: "✦" },
      { id: "timeline", label: "Timeline", href: "/timeline", glyph: "≡" },
      { id: "inbox", label: "WhatsApp", href: "/inbox", glyph: "✆" },
      { id: "email", label: "Email", href: "/email", glyph: "@" },
      { id: "chat", label: "Chat", href: "/chat", glyph: "◐" },
      { id: "calls", label: "Calls", href: "/calls", glyph: "☎" },
      { id: "meetings", label: "Meetings", href: "/meetings", glyph: "▭" },
      { id: "campaigns", label: "Campaigns", href: "/campaigns", glyph: "◫" },
      { id: "users", label: "Users & Roles", href: "/users", glyph: "◍" },
      { id: "audit-logs", label: "Audit Logs", href: "/audit-logs", glyph: "▤" },
      { id: "api-keys", label: "API Keys", href: "/api-keys", glyph: "⚿" },
      { id: "security", label: "Security", href: "/security", glyph: "⛨" },
    ],
  },
  {
    group: "CRM",
    items: [
      { id: "contacts", label: "Contacts", href: "/contacts", glyph: "◍" },
      { id: "companies", label: "Companies", href: "/companies", glyph: "▢" },
      { id: "leads", label: "Leads", href: "/leads", glyph: "✸" },
      { id: "deals", label: "Deals", href: "/deals", glyph: "◇" },
      { id: "pipelines", label: "Pipelines", href: "/pipelines", glyph: "≣" },
      { id: "tasks", label: "Tasks", href: "/tasks", glyph: "✓" },
      { id: "activities", label: "Activities", href: "/activities", glyph: "•" },
      { id: "sales-teams", label: "Sales Teams", href: "/sales-teams", glyph: "⬡" },
      { id: "sales-performance", label: "Sales Performance", href: "/sales-performance", glyph: "▲" },
      { id: "forecasting", label: "Forecasting", href: "/forecasting", glyph: "◴" },
      { id: "quotations", label: "Quotations", href: "/quotations", glyph: "▥" },
      { id: "customer-journey", label: "Customer Journey", href: "/customer-journey", glyph: "➔" },
      { id: "relationship-intelligence", label: "Relationship Intel", href: "/relationship-intelligence", glyph: "✦" },
    ],
  },
  {
    group: "Business",
    items: [
      { id: "invoice", label: "Invoices", href: "/invoices", glyph: "▣" },
      { id: "products", label: "Products", href: "/products", glyph: "▦" },
      { id: "suppliers", label: "Suppliers", href: "/suppliers", glyph: "◰" },
      { id: "customer", label: "Customer 360", href: "/customer", glyph: "❏" },
    ],
  },
];

const SIDEBAR_WIDTH = 240;

/** GlobalHeader — 64px shell bar. The only shared chrome, identical on every page. */
export function GlobalHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header style={{ height: uiConstants.header.heightDesktop, flexShrink: 0, background: "#fff", borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", position: "sticky", top: 0, zIndex: 40 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: color.ink.DEFAULT }}>Xen<span style={{ color: color.brand.primary }}>tral</span></span>
      <div style={{ flex: 1, maxWidth: uiConstants.aiSearch.maxWidth, minWidth: uiConstants.aiSearch.minWidth, margin: "0 auto", height: uiConstants.aiSearch.height, border: `1px solid ${color.line.strong}`, borderRadius: uiConstants.aiSearch.radius, display: "flex", alignItems: "center", padding: `0 ${uiConstants.aiSearch.paddingX}px`, color: color.ink.soft, fontSize: uiConstants.aiSearch.fontSize }}>✦ Ask Xentral AI…</div>
      {right ?? (
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: color.brand.primaryTint, color: color.brand.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>N</span>
      )}
    </header>
  );
}

/** Sidebar — fixed, grouped navigation rail. Scrolls independently of content. */
export function Sidebar({ active }: { active?: string }) {
  return (
    <nav style={{ width: SIDEBAR_WIDTH, flexShrink: 0, background: "#fff", borderRight: `1px solid ${color.line.DEFAULT}`, padding: "10px 10px 16px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
      {NAV.map((section) => (
        <div key={section.group} style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: color.ink.soft, padding: "6px 12px 4px" }}>{section.group}</div>
          {section.items.map((n) => {
            const on = n.id === active;
            return (
              <a key={n.id} href={n.href} style={{ display: "flex", alignItems: "center", gap: 10, height: 34, padding: "0 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: on ? 600 : 500, color: on ? color.brand.primary : color.ink.mid, background: on ? color.brand.primaryTint : "transparent" }}>
                <span style={{ width: 18, textAlign: "center", opacity: 0.9 }}>{n.glyph}</span>{n.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/**
 * AppShell — the locked page frame. Sidebar + GlobalHeader + main.
 * Action pages get a PageContainer; Tool pages pass `fullBleed` to fill the
 * viewport with their own surface (no content max-width, no PageContainer).
 */
export function AppShell({ children, active, fullBleed, headerRight }: { children: React.ReactNode; active?: string; fullBleed?: boolean; headerRight?: React.ReactNode }) {
  return (
    <div style={{ height: "100vh", display: "flex", background: color.surface.page, overflow: "hidden" }}>
      <Sidebar active={active} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <GlobalHeader right={headerRight} />
        {fullBleed ? (
          <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
        ) : (
          <main style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ paddingTop: 24, paddingBottom: 40 }}>
              <PageContainer>{children}</PageContainer>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default AppShell;
