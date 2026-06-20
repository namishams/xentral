/**
 * @xentral/config — ui-constants
 *
 * Fixed component dimensions. These are the enterprise "locks" (SAP Fiori /
 * Salesforce Lightning discipline). Components read these; pages never hardcode.
 * Governed file.
 */

export const header = {
  heightDesktop: 64,
  heightMobile: 56,
  sticky: true,
} as const;

export const aiSearch = {
  minWidth: 420,
  maxWidth: 520,
  height: 40,
  radius: 12,
  iconSize: 18,
  fontSize: 14,
  paddingX: 16,
} as const;

export const quickActions = {
  barHeight: 48,
  buttonHeight: 36,
  buttonPaddingX: 12,
  gap: 8,
  iconSize: 16,
  maxVisible: 5, // beyond this → "More" dropdown
} as const;

export const card = {
  kpi: { height: 96, minWidth: 220, maxWidth: 320 },
  medium: { height: 180, minWidth: 320 },
  large: { height: 280, minWidth: 480 },
  paddingX: 16,
  paddingY: 16,
  gap: 16,
  perRow: { desktop: 4, tablet: 2, mobile: 1 },
} as const;

export const table = {
  headerHeight: 44,
  rowHeight: { compact: 40, default: 48, comfortable: 56 },
  defaultDensity: "default" as const,
  pageSizeDefault: 25,
  pageSizeOptions: [25, 50, 100],
  stickyHeader: true,
  descriptionMaxLines: 2,
} as const;

export const form = {
  inputHeight: 36,
  textareaMinHeight: 96,
  labelFontSize: 14,
  fieldGap: 16,
  sectionGap: 24,
  columnsDesktop: 2,
  columnsMobile: 1,
} as const;

/**
 * Dashboard / Home — fixed dimensions for the KPI row, recommendation/bookmark
 * panels and the module action-tile grids. Every tile is identical because its
 * size comes from here, never from the page. This is the "germany-style"
 * pixel-consistency lock.
 */
export const dashboard = {
  greeting: { titleFontSize: 20, subFontSize: 13, marginBottom: 20 },
  kpiPerRow: 4,
  recommendation: { rowHeight: 48, accentWidth: 3, iconSize: 18, fontSize: 13.5, countFontSize: 13 },
  panel: { minHeight: 268, padding: 20, radius: 10, titleFontSize: 14, gap: 16 },
  actionTile: { width: 152, height: 100, iconSize: 26, radius: 10, gap: 16, labelFontSize: 13 },
  section: { titleFontSize: 14, marginTop: 24, marginBottom: 12 },
} as const;

/**
 * control — the single interactive-control sizing scale. Buttons, inputs,
 * selects, pills, icon buttons, avatars and the header search all read this so
 * every interactive element shares one height. No page hardcodes control sizes.
 */
export const control = {
  height: 36,      // universal control height
  heightSm: 30,    // dense variant (chips, table-inline)
  radius: 8,
  paddingX: 12,
  fontSize: 13,
} as const;

/** icon — the canonical icon-size ladder. xs chevrons → xl page badges. */
export const icon = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
} as const;

export const uiConstants = { header, aiSearch, quickActions, card, table, form, dashboard, control, icon } as const;
export default uiConstants;
