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
  kpi: { height: 112, minWidth: 220, maxWidth: 320 },
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
  inputHeight: 40,
  textareaMinHeight: 96,
  labelFontSize: 14,
  fieldGap: 16,
  sectionGap: 24,
  columnsDesktop: 2,
  columnsMobile: 1,
} as const;

export const uiConstants = { header, aiSearch, quickActions, card, table, form } as const;
export default uiConstants;
