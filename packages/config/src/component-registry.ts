/**
 * @xentral/config — component-registry
 *
 * The canonical list of LOCKED components. A page may import UI only from
 * @xentral/ui, and only components listed here. No page-specific versions,
 * no duplicates. The eslint boundary rule + this registry are enforced together.
 *
 * `status: "locked"` = exists & stable. `status: "planned"` = to be added to
 * @xentral/ui during the export (do not improvise a local version meanwhile).
 */

export type RegistryEntry = {
  name: string;
  exportName: string;        // export from @xentral/ui
  legacySource?: string;     // where it lives in the live app today (for the export)
  status: "locked" | "planned";
  archetype?: ("action" | "tool" | "both")[];
};

export const componentRegistry: RegistryEntry[] = [
  { name: "GlobalHeader", exportName: "GlobalHeader", legacySource: "components/app/topbar.tsx", status: "locked", archetype: ["both"] },
  { name: "Sidebar", exportName: "Sidebar", legacySource: "components/app/sidebar.tsx", status: "locked", archetype: ["both"] },
  { name: "AISearchBar", exportName: "AISearchBar", legacySource: "components/app/ai-command-bar.tsx", status: "locked", archetype: ["both"] },
  { name: "QuickActionsBar", exportName: "QuickActionsBar", legacySource: "components/app/record-action-bar.tsx", status: "locked", archetype: ["action"] },
  { name: "CommandPalette", exportName: "CommandPalette", legacySource: "components/app/command-palette.tsx", status: "locked", archetype: ["both"] },
  { name: "PageTitleRow", exportName: "PageTitleRow", legacySource: "components/ui/page-header.tsx", status: "locked", archetype: ["action"] },
  { name: "DataTable", exportName: "DataTable", legacySource: "components/ui/data-table.tsx", status: "locked", archetype: ["action"] },
  { name: "KPICard", exportName: "KPICard", legacySource: "components/ui/kpi-card.tsx", status: "locked", archetype: ["action"] },
  { name: "FilterBar", exportName: "FilterBar", legacySource: "components/ui/filter-bar.tsx", status: "locked", archetype: ["action"] },
  { name: "FormSection", exportName: "FormSection", legacySource: "components/ui/form-section.tsx", status: "locked", archetype: ["action"] },
  { name: "DetailDrawer", exportName: "DetailDrawer", legacySource: "components/ui/slide-over.tsx", status: "locked", archetype: ["both"] },
  { name: "EmptyState", exportName: "EmptyState", legacySource: "components/ui/empty-state.tsx", status: "locked", archetype: ["both"] },
  { name: "StatusBadge", exportName: "StatusBadge", legacySource: "components/ui/status-badge.tsx", status: "locked", archetype: ["both"] },
  { name: "Button", exportName: "Button", legacySource: "components/ui/button.tsx", status: "locked", archetype: ["both"] },
  { name: "Input", exportName: "Input", legacySource: "components/ui/input.tsx", status: "locked", archetype: ["both"] },
  { name: "Panel", exportName: "Panel", legacySource: "components/ui/panel.tsx", status: "locked", archetype: ["both"] },
  { name: "Skeleton", exportName: "Skeleton", legacySource: "components/ui/skeleton.tsx", status: "locked", archetype: ["both"] },
  { name: "Toaster", exportName: "Toaster", legacySource: "components/ui/toaster.tsx", status: "locked", archetype: ["both"] },

  // Gaps — to be created in @xentral/ui during the export (master-prompt requires them):
  { name: "PageContainer", exportName: "PageContainer", status: "locked", archetype: ["action"] },
  { name: "DashboardCard", exportName: "DashboardCard", status: "locked", archetype: ["action"] },
  { name: "EntityCard", exportName: "EntityCard", status: "planned", archetype: ["action"] },
  { name: "Modal", exportName: "Modal", status: "locked", archetype: ["both"] },
  { name: "Pagination", exportName: "Pagination", status: "locked", archetype: ["action"] },
];

export const lockedComponentNames = componentRegistry.filter((c) => c.status === "locked").map((c) => c.name);
export default componentRegistry;
