import * as React from "react";
import { color, uiConstants } from "@xentral/config";

/** Lucide-style stroke icons for the module launchpad tiles. */
const ICONS: Record<string, React.ReactNode> = {
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>,
  kanban: <><path d="M6 4v16M12 4v11M18 4v7" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>,
  trending: <><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21 8H6" /></>,
  package: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  truck: <><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9z" /><path d="m9 13 2 2 4-4" /></>,
  receipt: <><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1Z" /><path d="M9 8h6M9 12h6" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  landmark: <><path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10" /><path d="M12 3 21 8H3Z" /></>,
  percent: <><path d="M19 5 5 19" /><circle cx="7.5" cy="7.5" r="2" /><circle cx="16.5" cy="16.5" r="2" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M18 16V9M13 16V6M8 16v-3" /></>,
  message: <><path d="M21 11.5a8.4 8.4 0 0 1-12 7.5L3 21l2-6a8.4 8.4 0 1 1 16-3.5Z" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 11.5a16 16 0 0 0 6 6l1.1-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  megaphone: <><path d="m3 11 15-7v16l-7-3.3" /><path d="M3 11v4h5l1 5" /></>,
};

/**
 * ActionTile — locked module launcher tile. Fixed square dimensions from
 * ui-constants.dashboard.actionTile, with a branded icon badge over a label.
 */
export function ActionTile({ label, icon, glyph, href = "#" }: { label: string; icon?: string; glyph?: React.ReactNode; href?: string }) {
  const t = uiConstants.dashboard.actionTile;
  return (
    <a href={href} style={{ width: t.width, height: t.height, flexShrink: 0, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: t.radius, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, textDecoration: "none", color: color.ink.DEFAULT }}>
      <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 11, background: color.brand.primaryTint, color: color.brand.primary, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {icon && ICONS[icon]
          ? <svg width={uiConstants.icon.xl} height={uiConstants.icon.xl} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</svg>
          : <span style={{ fontSize: 18 }}>{glyph}</span>}
      </span>
      <span style={{ fontSize: t.labelFontSize, fontWeight: 500, color: color.ink.DEFAULT }}>{label}</span>
    </a>
  );
}
