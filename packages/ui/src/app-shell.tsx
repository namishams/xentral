import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { PageContainer } from "./page-container";

const NAV = [
  { id: "dashboard", label: "Mission Control", href: "/dashboard", glyph: "◷" },
  { id: "invoice", label: "Invoices", href: "/invoice", glyph: "▤" },
  { id: "inbox", label: "Inbox", href: "/inbox", glyph: "✉" },
  { id: "deals", label: "Deals", href: "/dashboard", glyph: "◇" },
  { id: "books", label: "Books", href: "/invoice", glyph: "▣" },
  { id: "products", label: "Products", href: "/products", glyph: "▦" },
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

/** Sidebar — fixed navigation rail. */
export function Sidebar({ active }: { active?: string }) {
  return (
    <nav style={{ width: SIDEBAR_WIDTH, flexShrink: 0, background: "#fff", borderRight: `1px solid ${color.line.DEFAULT}`, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV.map((n) => {
        const on = n.id === active;
        return (
          <a key={n.id} href={n.href} style={{ display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: on ? 600 : 500, color: on ? color.brand.primary : color.ink.mid, background: on ? color.brand.primaryTint : "transparent" }}>
            <span style={{ width: 18, textAlign: "center", opacity: 0.9 }}>{n.glyph}</span>{n.label}
          </a>
        );
      })}
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
