"use client";

import * as React from "react";
import { color } from "@xentral/config";

/** Real (lucide-style) icon paths, keyed by a short name. Strong, branded — like the old build. */
const ICON: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  building: <><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></>,
  package: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  gear: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  store: <><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M2 7h20" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  message: <><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  landmark: <><line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>,
  cart: <><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></>,
  activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>,
  check: <><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" /></>,
  spark: <><path d="M9.94 14.34A2 2 0 0 0 8.66 13L3 11l5.66-2a2 2 0 0 0 1.28-1.34L12 2l2.06 5.66A2 2 0 0 0 15.34 9L21 11l-5.66 2a2 2 0 0 0-1.28 1.34L12 20Z" /><path d="M20 3v4" /><path d="M22 5h-4" /></>,
  repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
};

/** Route prefix → icon key (longest match wins). */
const ROUTES: [string, string][] = [
  ["/settings/ai-hub", "spark"], ["/settings/integrations", "gear"], ["/org/branches", "building"],
  ["/dashboard", "grid"], ["/ai", "spark"], ["/timeline", "activity"], ["/activities", "activity"],
  ["/calendar", "calendar"], ["/meetings", "calendar"], ["/scheduling", "calendar"],
  ["/work-queue", "check"], ["/tasks", "check"], ["/leads", "target"], ["/contacts", "user"],
  ["/companies", "building"], ["/parties", "building"], ["/warehouses", "building"], ["/suppliers", "building"],
  ["/deals", "target"], ["/pipelines", "target"], ["/forecasting", "chart"], ["/reports", "chart"],
  ["/quotations", "file"], ["/documents", "file"], ["/marketplace", "store"], ["/reseller", "store"], ["/partner", "store"],
  ["/o2c", "repeat"], ["/p2p", "repeat"], ["/orders", "cart"], ["/products", "package"], ["/inventory", "package"],
  ["/commerce", "package"], ["/categories", "package"], ["/price-lists", "package"], ["/procurement", "cart"],
  ["/invoices", "receipt"], ["/invoice", "receipt"], ["/payments", "card"], ["/billing", "card"],
  ["/receivables", "landmark"], ["/payables", "landmark"], ["/banking", "landmark"], ["/ledger", "landmark"], ["/vat", "landmark"],
  ["/payroll", "users"], ["/inbox", "message"], ["/email", "mail"], ["/calls", "message"], ["/service-desk", "message"],
  ["/campaigns", "mail"], ["/people", "users"], ["/users", "users"], ["/developer", "gear"], ["/api-keys", "gear"],
  ["/admin", "shield"], ["/security", "shield"], ["/roles", "shield"], ["/audit-logs", "shield"],
  ["/automations", "gear"], ["/settings", "gear"], ["/account", "user"], ["/projects", "check"],
];

function keyForPath(path: string): string {
  let best = ""; let key = "grid";
  for (const [href, k] of ROUTES) {
    if ((path === href || path.startsWith(href + "/") || path.startsWith(href)) && href.length > best.length) { best = href; key = k; }
  }
  return key;
}

/** PageTitleRow — enterprise Action-page header: strong icon badge + breadcrumb + title (20px) + optional badge + actions. */
export function PageTitleRow({ title, subtitle, breadcrumb, badge, actions, icon, showIcon = true }: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
}) {
  const [key, setKey] = React.useState<string | null>(null);
  React.useEffect(() => { if (typeof window !== "undefined") setKey(keyForPath(window.location.pathname)); }, []);

  const iconBadge = !showIcon ? null : (
    <span aria-hidden="true" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {icon ?? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {key ? ICON[key] : ICON.grid}
        </svg>
      )}
    </span>
  );

  return (
    <div style={{ display: "flex", alignItems: subtitle || breadcrumb ? "flex-end" : "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {iconBadge}
        <div style={{ minWidth: 0 }}>
          {breadcrumb && <div style={{ fontSize: 12, color: color.ink.soft }}>{breadcrumb}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 20, lineHeight: "26px", fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{title}</h1>
            {badge}
          </div>
          {subtitle && <p style={{ fontSize: 13, color: color.ink.mid, margin: "2px 0 0" }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
