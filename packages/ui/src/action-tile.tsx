import * as React from "react";
import { color, uiConstants } from "@xentral/config";

/**
 * ActionTile — the locked module launcher tile (Home dashboard grids).
 * Fixed square dimensions from ui-constants.dashboard.actionTile, so every
 * tile across every section is pixel-identical. Icon (glyph) over a label.
 */
export function ActionTile({ label, glyph, href = "#" }: { label: string; glyph: React.ReactNode; href?: string }) {
  const t = uiConstants.dashboard.actionTile;
  return (
    <a
      href={href}
      style={{
        width: t.width,
        height: t.height,
        flexShrink: 0,
        background: "#fff",
        border: `1px solid ${color.line.DEFAULT}`,
        borderRadius: t.radius,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textDecoration: "none",
        color: color.ink.DEFAULT,
      }}
    >
      <span style={{ fontSize: t.iconSize, color: color.ink.mid, lineHeight: 1 }} aria-hidden="true">{glyph}</span>
      <span style={{ fontSize: t.labelFontSize, color: color.ink.DEFAULT }}>{label}</span>
    </a>
  );
}
