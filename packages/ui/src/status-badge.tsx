import * as React from "react";
import { color } from "@xentral/config";

export type BadgeTone = "neutral" | "info" | "positive" | "warning" | "critical";

const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: color.surface.sunken, fg: color.ink.mid },
  info: { bg: "#e6f1fb", fg: color.brand.primary },
  positive: { bg: "#e6f4ea", fg: color.status.positive },
  warning: { bg: "#fbe8d4", fg: color.status.critical },
  critical: { bg: "#fdecea", fg: color.status.negative },
};

/** StatusBadge — locked pill for statuses. Text always uses the tone's dark shade. */
export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 600, background: t.bg, color: t.fg, borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap" }}>{label}</span>
  );
}
