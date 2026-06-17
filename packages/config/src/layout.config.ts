/**
 * @xentral/config — layout.config
 *
 * Grid, max-widths, page padding, breakpoints, vertical rhythm.
 * The 12-column enterprise grid. Governed file.
 */

export const grid = { columns: 12, gutter: 16 } as const;

export const contentMaxWidth = {
  desktop: 1440,
  largeDesktop: 1600,
} as const;

export const pagePadding = {
  desktop: 32,
  tablet: 24,
  mobile: 16,
} as const;

/** Vertical rhythm between blocks. */
export const verticalSpacing = {
  betweenSections: 24,
  betweenCards: 16,
  insideCardMin: 16,
  insideCardMax: 20,
} as const;

/** Breakpoints (min-width px). App is desktop-primary; portal/marketing fully responsive. */
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
} as const;

/** The two canonical page archetypes. Every page declares one. */
export const pageArchetype = {
  /** Records & transactional screens — full furniture. */
  action: {
    regions: ["GlobalHeader", "PageContainer", "PageTitleRow", "QuickActionsBar", "ContentGrid", "Pagination?"],
    hasQuickActions: true,
    hasTitleRow: true,
  },
  /** Immersive full-bleed tools (chat, whatsapp, campaign, automations canvas, calendar). */
  tool: {
    regions: ["GlobalHeader", "ToolSurface"],
    hasQuickActions: false,
    hasTitleRow: false,
    fullBleed: true,
  },
} as const;
export type PageArchetype = keyof typeof pageArchetype;

export const layoutConfig = { grid, contentMaxWidth, pagePadding, verticalSpacing, breakpoints, pageArchetype } as const;
export default layoutConfig;
