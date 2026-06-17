import * as React from "react";
import { color, uiConstants } from "@xentral/config";

/** KPICard — locked 112px summary tile. label (top) + value (22px) + optional note. */
export function KPICard({ label, value, note, noteTone }: {
  label: string;
  value: string;
  note?: string;
  noteTone?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: uiConstants.card.kpi.minWidth, maxWidth: uiConstants.card.kpi.maxWidth, height: uiConstants.card.kpi.height, background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: uiConstants.card.kpi.height ? 14 : 14, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ fontSize: 12, color: color.ink.mid }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, lineHeight: "28px" }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: noteTone ?? color.ink.soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{note}</div>}
    </div>
  );
}
