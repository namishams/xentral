import * as React from "react";
import { color } from "@xentral/config";

export type BadgeTone = "neutral" | "info" | "positive" | "warning" | "critical";

const mix = (v: string) => `color-mix(in srgb, ${v} 15%, ${color.surface.card})`;
const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: color.surface.sunken, fg: color.ink.mid },
  info: { bg: mix(color.brand.primary), fg: color.brand.primary },
  positive: { bg: mix(color.status.positive), fg: color.status.positive },
  warning: { bg: mix(color.status.critical), fg: color.status.critical },
  critical: { bg: mix(color.status.negative), fg: color.status.negative },
};

/** StatusBadge — locked pill for statuses. Text always uses the tone's dark shade. */
export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, background: t.bg, color: t.fg, borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap" }}>{label}</span>
  );
}
