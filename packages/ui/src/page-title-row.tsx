"use client";

import * as React from "react";
import { color } from "@xentral/config";

/** Route → icon glyph map (mirrors the sidebar so the page header icon matches the nav). */
const ROUTE_ICONS: [string, string][] = [
  ["/settings/ai-hub", "✦"], ["/settings/integrations", "⚯"], ["/org/branches", "▢"],
  ["/dashboard", "◷"], ["/ai", "✦"], ["/timeline", "≡"], ["/calendar", "▦"], ["/work-queue", "✓"],
  ["/leads", "✸"], ["/contacts", "◍"], ["/companies", "▢"], ["/deals", "◇"], ["/pipelines", "≣"],
  ["/quotations", "▥"], ["/forecasting", "◴"], ["/marketplace", "◫"], ["/reseller", "◎"], ["/partner", "◍"],
  ["/o2c", "⇄"], ["/p2p", "⇆"], ["/parties", "◑"], ["/orders", "▤"], ["/products", "▦"],
  ["/inventory", "▥"], ["/warehouses", "▢"], ["/procurement", "◰"], ["/suppliers", "◰"], ["/projects", "▭"],
  ["/commerce", "▦"], ["/invoices", "▣"], ["/invoice", "▣"], ["/payments", "◇"], ["/receivables", "▤"],
  ["/payables", "▥"], ["/vat", "％"], ["/reports", "▦"], ["/banking", "▤"], ["/ledger", "≣"],
  ["/payroll", "◰"], ["/price-lists", "▦"], ["/categories", "≣"], ["/inbox", "✆"], ["/email", "@"],
  ["/calls", "☎"], ["/meetings", "▭"], ["/campaigns", "◫"], ["/people", "◍"], ["/documents", "▦"],
  ["/scheduling", "▦"], ["/service-desk", "☎"], ["/developer", "⌘"], ["/admin", "⌂"], ["/users", "◍"],
  ["/roles", "⚿"], ["/audit-logs", "▤"], ["/api-keys", "⚇"], ["/security", "⛨"], ["/automations", "⚙"],
  ["/settings", "⚙"], ["/account", "◍"], ["/billing", "▣"], ["/tasks", "✓"], ["/activities", "≡"],
];

function glyphForPath(path: string): string {
  let best = ""; let glyph = "";
  for (const [href, g] of ROUTE_ICONS) {
    if ((path === href || path.startsWith(href + "/") || path.startsWith(href)) && href.length > best.length) { best = href; glyph = g; }
  }
  return glyph || "▦";
}

/** PageTitleRow — enterprise Action-page header: icon badge + breadcrumb + title (20px) + optional badge + actions. */
export function PageTitleRow({ title, subtitle, breadcrumb, badge, actions, icon, showIcon = true }: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
}) {
  const [glyph, setGlyph] = React.useState<string>("");
  React.useEffect(() => { if (typeof window !== "undefined") setGlyph(glyphForPath(window.location.pathname)); }, []);

  const iconBadge = !showIcon ? null : (
    <span aria-hidden="true" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, lineHeight: 1 }}>
      {icon ?? glyph}
    </span>
  );

  return (
    <div style={{ display: "flex", alignItems: subtitle || breadcrumb ? "flex-end" : "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {iconBadge}
        <div style={{ minWidth: 0 }}>
          {breadcrumb && <div style={{ fontSize: 11.5, color: color.ink.soft }}>{breadcrumb}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 20, lineHeight: "26px", fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{title}</h1>
            {badge}
          </div>
          {subtitle && <p style={{ fontSize: 12.5, color: color.ink.mid, margin: "2px 0 0" }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
