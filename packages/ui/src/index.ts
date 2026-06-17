/**
 * @xentral/ui — locked component library. Pages import ONLY from here.
 */
export const UI_PACKAGE = "@xentral/ui";

// App shell (locked chrome) — the only header/sidebar; no page may inline its own.
export { AppShell, GlobalHeader, Sidebar } from "./app-shell";

// Locked primitives:
export { PageContainer, type PageContainerProps } from "./page-container";
export { PageTitleRow } from "./page-title-row";
export { DashboardCard, type DashboardCardProps } from "./dashboard-card";
export { KPICard } from "./kpi-card";
export { DataTable, type Column } from "./data-table";
export { StatusBadge, type BadgeTone } from "./status-badge";
export { FilterBar } from "./filter-bar";
export { EmptyState } from "./empty-state";
export { Button, type ButtonVariant } from "./button";
export { Input } from "./input";
export { Modal, type ModalProps } from "./modal";
export { Pagination, type PaginationProps } from "./pagination";

// Migrated next: AISearchBar, QuickActionsBar, FormSection, DetailDrawer,
// Panel, Skeleton, Toaster.
