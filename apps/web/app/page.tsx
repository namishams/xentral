"use client";

import * as React from "react";
import { tokens, uiConstants, componentRegistry, layoutConfig } from "@xentral/config";
import { PageContainer, DashboardCard, Modal, Pagination } from "@xentral/ui";
import { MarketingHighlights } from "@xentral/module-marketing";

const ROADMAP = [
  ["Phase 0", "Map", "done"],
  ["Phase 1", "Gerüst — design system + 4 locked components", "done"],
  ["Phase 2", "Safety net — typecheck 7/7 · boundaries=error · pre-commit · Vitest 6/6 · CI ✓", "done"],
  ["Phase 3", "Kernel contracts carved — tenancy·permissions·party·document·email·money ✓", "done"],
  ["Phase 4", "12 modules exported as contracts ✓ · real page/logic migration next", "active"],
  ["Task 1", "Action pages fixed bars · Tool pages full-bleed", "todo"],
  ["Phase 5", "Plugins & themes (compliance-uae first)", "todo"],
] as const;

const TONE: Record<string, string> = { done: "#188918", active: "#0064d9", next: "#df6e0c", todo: "#8396a8" };

export default function BuildConsole() {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const locked = componentRegistry.filter((c) => c.status === "locked").length;
  const planned = componentRegistry.filter((c) => c.status === "planned").length;
  const c = tokens.color;

  return (
    <main style={{ paddingTop: 28, paddingBottom: 48 }}>
      <PageContainer>
        <header style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: c.brand.primary }}>NEXT.XENTRAL.AE · LIVE BUILD CONSOLE</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: c.ink.DEFAULT, margin: "6px 0 4px" }}>Xentral — Modular Rebuild</h1>
          <p style={{ fontSize: 14, color: c.ink.mid }}>Follow the modular build live. Updated as packages, components and modules land. The production app stays on app.xentral.ae.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <a href="/dashboard" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: c.brand.primary, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Mission Control page →</a>
            <a href="/invoice" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, color: c.ink.DEFAULT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Invoice record page →</a>
            <a href="/inbox" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, color: c.ink.DEFAULT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Inbox (Tool page) →</a>
            <a href="/invoices" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, color: c.ink.DEFAULT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Invoices list (real data) →</a>
            <a href="/deals" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, color: c.ink.DEFAULT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Deals list (CRM contract) →</a>
            <a href="/customer" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, color: c.ink.DEFAULT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Customer 360 (books + crm) →</a>
            <a href="/products" style={{ display: "inline-flex", height: 34, padding: "0 16px", alignItems: "center", borderRadius: 8, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, color: c.ink.DEFAULT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Products (ERP contract) →</a>
          </div>
        </header>

        {/* Roadmap */}
        <section style={{ background: "#fff", border: `1px solid ${c.line.DEFAULT}`, borderRadius: 10, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: c.ink.DEFAULT, margin: "0 0 12px" }}>Roadmap</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {ROADMAP.map(([p, label, st]) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 64, fontSize: 12, fontWeight: 700, color: c.ink.soft }}>{p}</span>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: TONE[st] }} />
                <span style={{ fontSize: 13.5, color: c.ink.DEFAULT }}>{label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: TONE[st], textTransform: "uppercase" }}>{st}</span>
              </div>
            ))}
          </div>
        </section>

        {/* KPI row — DashboardCard sizes */}
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          {[["Locked components", String(locked)], ["Planned", String(planned)], ["Modules mapped", "13"], ["LOC to export", "73k"]].map(([k, v]) => (
            <DashboardCard key={k} size="kpi" title={k}>
              <div style={{ fontSize: 30, fontWeight: 700, color: c.ink.DEFAULT }}>{v}</div>
            </DashboardCard>
          ))}
        </div>

        {/* Component gallery */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: c.ink.DEFAULT, margin: "28px 0 12px" }}>Locked components (live)</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <DashboardCard size="medium" title="DashboardCard">
            <p style={{ fontSize: 13, color: c.ink.mid }}>Fixed height, token-bound, truncates overflow. This card is itself the component.</p>
          </DashboardCard>
          <div style={{ display: "grid", gap: 12 }}>
            <button onClick={() => setOpen(true)} style={{ height: 36, padding: "0 16px", borderRadius: 8, background: c.brand.primary, color: "#fff", border: 0, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Open Modal</button>
            <Pagination page={page} pageCount={8} pageSize={uiConstants.table.pageSizeDefault} total={186} onPageChange={setPage} onPageSizeChange={() => {}} />
          </div>
        </div>

        {/* First exported module — consumed via its contract */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: c.ink.DEFAULT, margin: "28px 0 4px" }}>Module: marketing <span style={{ fontSize: 11, fontWeight: 700, color: c.status.positive }}>· exported (Phase 4)</span></h2>
        <p style={{ fontSize: 12, color: c.ink.soft, margin: "0 0 12px" }}>Rendered from <code>@xentral/module-marketing</code> via its public contract — module → ui → config, boundaries enforced.</p>
        <MarketingHighlights />

        {/* All exported modules */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: c.ink.DEFAULT, margin: "28px 0 4px" }}>Exported modules</h2>
        <p style={{ fontSize: 12, color: c.ink.soft, margin: "0 0 12px" }}>Each is a contract-bounded package (typecheck + boundaries + tests green). 49/49 CI tasks. Kernel contracts carved: tenancy · permissions · party · document · email · money.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["marketing","portal","payments","crm","books","erp","comms","ai","marketplace","payroll","developer","platform"].map((m) => (
            <span key={m} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#fff", border: `1px solid ${c.line.DEFAULT}`, fontSize: 12.5, color: c.ink.DEFAULT }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: c.status.positive }} /> @xentral/module-{m}
            </span>
          ))}
        </div>

        {/* Tokens */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: c.ink.DEFAULT, margin: "28px 0 12px" }}>Design tokens</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries({ primary: c.brand.primary, ink: c.ink.DEFAULT, "ink-mid": c.ink.mid, positive: c.status.positive, critical: c.status.critical, negative: c.status.negative }).map(([n, hex]) => (
            <div key={n} style={{ width: 110, border: `1px solid ${c.line.DEFAULT}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
              <div style={{ height: 40, background: hex }} />
              <div style={{ padding: "6px 8px", fontSize: 11 }}><b>{n}</b><br />{hex}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: c.ink.soft, marginTop: 10 }}>Spacing scale: {tokens.spacing.join(" · ")} · Grid {layoutConfig.grid.columns}-col · Max {layoutConfig.contentMaxWidth.desktop}px</p>
      </PageContainer>

      <Modal open={open} onClose={() => setOpen(false)} title="Locked Modal component"
        footer={<button onClick={() => setOpen(false)} style={{ height: 36, padding: "0 16px", borderRadius: 8, background: c.brand.primary, color: "#fff", border: 0, fontWeight: 600, cursor: "pointer" }}>Close</button>}>
        Accessible dialog from <b>@xentral/ui</b> — ESC to close, overlay click, focus return. Dimensions from the locked design system.
      </Modal>
    </main>
  );
}
