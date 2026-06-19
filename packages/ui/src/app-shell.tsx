"use client";

import { XentralMark } from "./xentral-mark";
import { HeaderSearch, HeaderTools, HeaderAvatar } from "./header-menu";
import * as React from "react";
import { NavIcon } from "./nav-icons";
import { ThemeToggle } from "./theme-toggle";
import { color, uiConstants } from "@xentral/config";
import { PageContainer } from "./page-container";
import { AiLauncher, AiCommandBand } from "./ai-launcher";

/**
 * NAV — the locked navigation map, ordered by the BUSINESS LIFECYCLE, not by
 * technical modules. A founder thinks Lead → Customer → Quote → Order →
 * Delivery → Invoice → Payment → Support, so the platform is grouped that way:
 *   Mission Control · Revenue · Operations · Finance · Communication · Admin
 * Grundregel: every new feature/plugin/module/industry cloud subordinates to
 * one of these lifecycle categories. See docs/INFORMATION-ARCHITECTURE.md.
 * `id` matches each page's <AppShell active="…">; `href` is the live route.
 */
type NavItem = { id: string; label: string; href: string; glyph: string };
type NavGroup = { group: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    group: "Mission Control",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", glyph: "◷" },
      { id: "ai", label: "Ask Xentral AI", href: "/ai", glyph: "✦" },
      { id: "timeline", label: "Timeline", href: "/timeline", glyph: "≡" },
      { id: "calendar", label: "Calendar", href: "/calendar", glyph: "▦" },
      { id: "work-queue", label: "Work Queue", href: "/work-queue", glyph: "✓" },
    ],
  },
  {
    group: "Revenue",
    items: [
      { id: "leads", label: "Leads", href: "/leads", glyph: "✸" },
      { id: "contacts", label: "Contacts", href: "/contacts", glyph: "◍" },
      { id: "companies", label: "Companies", href: "/companies", glyph: "▢" },
      { id: "deals", label: "Deals", href: "/deals", glyph: "◇" },
      { id: "pipelines", label: "Pipelines", href: "/pipelines", glyph: "≣" },
      { id: "quotations", label: "Quotes", href: "/quotations", glyph: "▥" },
      { id: "forecasting", label: "Forecasting", href: "/forecasting", glyph: "◴" },
    ],
  },
  {
    group: "Marketplace",
    items: [
      { id: "marketplace", label: "Marketplace", href: "/marketplace", glyph: "◫" },
      { id: "reseller", label: "Reseller", href: "/reseller", glyph: "◎" },
      { id: "partner", label: "Partner Program", href: "/partner", glyph: "◍" },
    ],
  },
  {
    group: "Processes",
    items: [
      { id: "o2c", label: "Order-to-Cash", href: "/o2c", glyph: "⇄" },
      { id: "p2p", label: "Procure-to-Pay", href: "/p2p", glyph: "⇆" },
      { id: "parties", label: "Business Partners", href: "/parties", glyph: "◑" },
    ],
  },
  {
    group: "Operations",
    items: [
      { id: "orders", label: "Orders", href: "/orders", glyph: "▤" },
      { id: "products", label: "Products", href: "/products", glyph: "▦" },
      { id: "inventory", label: "Inventory", href: "/inventory", glyph: "▥" },
      { id: "warehouses", label: "Warehouses", href: "/warehouses", glyph: "▢" },
      { id: "procurement", label: "Procurement", href: "/procurement", glyph: "◰" },
      { id: "suppliers", label: "Suppliers", href: "/suppliers", glyph: "◰" },
      { id: "projects", label: "Projects", href: "/projects", glyph: "▭" },
      { id: "commerce", label: "Commerce", href: "/commerce", glyph: "▦" },
    ],
  },
  {
    group: "Finance",
    items: [
      { id: "books", label: "Finance overview", href: "/books", glyph: "◆" },
      { id: "customers", label: "Customers", href: "/customers", glyph: "◍" },
      { id: "invoice", label: "Invoices", href: "/invoices", glyph: "▣" },
      { id: "payments", label: "Payments", href: "/payments", glyph: "◇" },
      { id: "receivables", label: "Receivables", href: "/receivables", glyph: "▤" },
      { id: "payables", label: "Payables", href: "/payables", glyph: "▥" },
      { id: "vat", label: "VAT", href: "/vat", glyph: "％" },
      { id: "reports", label: "Reports", href: "/reports", glyph: "▦" },
      { id: "banking", label: "Banking", href: "/banking", glyph: "▤" },
      { id: "ledger", label: "Ledger", href: "/ledger", glyph: "≣" },
      { id: "payroll", label: "Payroll", href: "/payroll", glyph: "◰" },
      { id: "price-lists", label: "Price Lists", href: "/price-lists", glyph: "▦" },
      { id: "categories", label: "Categories", href: "/categories", glyph: "≣" },
    ],
  },
  {
    group: "Communication",
    items: [
      { id: "inbox", label: "WhatsApp", href: "/inbox", glyph: "✆" },
      { id: "email", label: "Email", href: "/email", glyph: "@" },
      { id: "calls", label: "Calls", href: "/calls", glyph: "☎" },
      { id: "meetings", label: "Meetings", href: "/meetings", glyph: "▭" },
      { id: "campaigns", label: "Campaigns", href: "/campaigns", glyph: "◫" },
    ],
  },
  {
    group: "Workspace",
    items: [
      { id: "people", label: "People", href: "/people", glyph: "◍" },
      { id: "documents", label: "Documents", href: "/documents", glyph: "▦" },
      { id: "scheduling", label: "Scheduling", href: "/scheduling", glyph: "▦" },
      { id: "service-desk", label: "Service Desk", href: "/service-desk", glyph: "☎" },
      { id: "developer", label: "Developer", href: "/developer", glyph: "⌘" },
    ],
  },
  {
    group: "Administration",
    items: [
      { id: "admin", label: "Admin Portal", href: "/admin", glyph: "⌂" },
      { id: "users", label: "Users", href: "/users", glyph: "◍" },
      { id: "roles", label: "Roles", href: "/roles", glyph: "⚿" },
      { id: "audit-logs", label: "Audit Logs", href: "/audit-logs", glyph: "▤" },
      { id: "api-keys", label: "API Keys", href: "/api-keys", glyph: "⚇" },
      { id: "security", label: "Security", href: "/security", glyph: "⛨" },
      { id: "settings", label: "Settings", href: "/settings", glyph: "⚙" },
      { id: "ai-hub", label: "AI Hub", href: "/settings/ai-hub", glyph: "✦" },
      { id: "integrations", label: "Integrations", href: "/settings/integrations", glyph: "⚯" },
      { id: "automations", label: "Automations", href: "/automations", glyph: "⚙" },
      { id: "branches", label: "Branches", href: "/org/branches", glyph: "▢" },
    ],
  },
];

const SIDEBAR_WIDTH = 240;

/** GlobalHeader — rich shell bar (mirrors the live app top bar). */
export function GlobalHeader({ right }: { right?: React.ReactNode }) {
  const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, color: color.ink.mid, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 };
  const iconBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${color.line.DEFAULT}`, background: color.surface.card, color: color.ink.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", position: "relative", flexShrink: 0 };
  return (
    <header style={{ height: uiConstants.header.heightDesktop, flexShrink: 0, background: color.surface.card, borderBottom: `1px solid ${color.line.DEFAULT}`, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", position: "sticky", top: 0, zIndex: 40 }}>
      <span style={{ flex: 1 }} />
      <HeaderSearch />
      <HeaderTools />
      <ThemeToggle />
      {right ?? (
        <HeaderAvatar />
      )}
    </header>
  );
}

/** Sidebar — brand + workspace header, then lifecycle-grouped nav. */
export function Sidebar({ active }: { active?: string }) {
  const [me, setMe] = React.useState<{ superAdmin?: boolean; companyName?: string; credits?: number }>({});
  React.useEffect(() => { fetch("/api/me").then((r) => r.json()).then((j) => setMe(j || {})).catch(() => {}); }, []);
  const superAdmin = !!me.superAdmin;
  return (
    <nav style={{ width: SIDEBAR_WIDTH, flexShrink: 0, background: color.surface.card, borderRight: `1px solid ${color.line.DEFAULT}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${color.line.DEFAULT}` }}>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none", color: color.ink.DEFAULT }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><XentralMark size={26} /></span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Xentral</span>
        </a>
        <div style={{ marginTop: 12, background: color.surface.sunken, borderRadius: 9, padding: "9px 11px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{me.companyName || "Workspace"}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 12, color: color.status.positive, fontWeight: 600 }}>● {(me.credits ?? 0).toLocaleString()} credits</span>
            <a href="/settings" style={{ fontSize: 12, fontWeight: 600, color: color.brand.primary, textDecoration: "none" }}>Top Up</a>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 10px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((section) => (
          <div key={section.group} style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: color.ink.soft, padding: "6px 12px 4px" }}>{section.group}</div>
            {section.items.filter((n) => n.id !== "admin" || superAdmin).map((n) => {
              const on = n.id === active;
              return (
                <a key={n.id} href={n.href} style={{ display: "flex", alignItems: "center", gap: 10, height: 34, padding: "0 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: on ? 600 : 500, color: on ? color.brand.primary : color.ink.mid, background: on ? color.brand.primaryTint : "transparent" }}>
                  <span style={{ width: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><NavIcon id={n.id} glyph={n.glyph} /></span>{n.label}
                </a>
              );
            })}
          </div>
        ))}
      </div>
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
        <AiCommandBand />
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
      {active !== "inbox" ? <AiLauncher /> : null}
    </div>
  );
}

export default AppShell;
