/**
 * @xentral/config — design-tokens
 *
 * THE single source of truth for colour, type, spacing, radius, shadow.
 * No page or component may hardcode these values. Tailwind reads from here
 * (via the preset), and runtime code imports from here.
 *
 * Governed file. Changing a token is a design-system change → owner approval.
 */

/** SAP Fiori Horizon Light — Xentral semantic palette. Brand identity, do not alter. */
export const color = {
  brand: { primary: "#0064d9", primaryHover: "#0057be", primaryTint: "#e8f1ff" },
  shell: { bar: "#283d50", alt: "#354a5e" },
  surface: { page: "#f5f6f7", card: "#ffffff", sunken: "#eef1f4" },
  line: { DEFAULT: "#e5e5e5", strong: "#d5dadf" },
  ink: { DEFAULT: "#1d2d3e", mid: "#556b82", soft: "#8396a8", onPrimary: "#ffffff" },
  status: { positive: "#188918", critical: "#df6e0c", negative: "#cc1919", info: "#0064d9" },
} as const;

/** The ONLY spacing values allowed anywhere. Index by step. */
export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const;
export type SpacingStep = (typeof spacing)[number];

export const radius = { sm: 6, md: 8, lg: 10, xl: 12, pill: 9999 } as const;

export const shadow = {
  none: "none",
  card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
  raised: "0 4px 12px rgba(16,24,40,0.08)",
  overlay: "0 12px 32px rgba(16,24,40,0.16)",
} as const;

/** Type scale (px). Body default 14. */
export const fontSize = {
  xs: 11, sm: 12, base: 13, md: 14, lg: 16, xl: 18, "2xl": 20, "3xl": 24, display: 30,
} as const;

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

export const zIndex = { base: 0, sticky: 30, header: 40, drawer: 50, modal: 60, toast: 70 } as const;

export const tokens = { color, spacing, radius, shadow, fontSize, fontWeight, zIndex } as const;
export default tokens;


/** SAP Fiori Horizon Night — dark theme palette. Same semantic keys as `color`,
 * so a ThemePort can swap palettes without touching any component. AA-contrast. */
export const colorDark = {
  brand: { primary: "#4a9eff", primaryHover: "#6cb2ff", primaryTint: "#16243b" },
  shell: { bar: "#0b1220", alt: "#111a2b" },
  surface: { page: "#0b1220", card: "#141d2e", sunken: "#1b2740" },
  line: { DEFAULT: "#27324a", strong: "#384a66" },
  ink: { DEFAULT: "#e7edf6", mid: "#aebccf", soft: "#7e8ea4", onPrimary: "#0b1220" },
  status: { positive: "#46c560", critical: "#f0944a", negative: "#ff6b6b", info: "#4a9eff" },
} as const;


/** Pastel pipeline-stage palette (monday.com style). bg = pastel fill, fg = dark
 * shade of the same family (AA contrast). Read by the locked StagePill. */
export const pipeline = {
  new:         { bg: "#BFDBFE", fg: "#1E3A8A" },
  qualified:   { bg: "#93C5FD", fg: "#1E3A8A" },
  proposal:    { bg: "#A5B4FC", fg: "#312E81" },
  negotiation: { bg: "#C4B5FD", fg: "#4C1D95" },
  won:         { bg: "#86EFAC", fg: "#14532D" },
  lost:        { bg: "#FCA5A5", fg: "#7F1D1D" },
  working:     { bg: "#FDE68A", fg: "#854D0E" },
  unqualified: { bg: "#E2E8F0", fg: "#475569" },
} as const;
