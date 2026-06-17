/**
 * @xentral/kernel — FROZEN CORE. Published contract surface only.
 * Modules import from here; the kernel imports from no module.
 * Any change here requires the owner's explicit approval (see KERNEL-CHANGELOG).
 */
export const KERNEL_PACKAGE = "@xentral/kernel";

// Money primitives — the sacred money-path invariants (tested).
export { roundMoney, applyPayment } from "./money";
export type { PaymentStatus, ApplyPaymentResult } from "./money";

// Carved kernel contracts (the typed surfaces modules code against).
export { requireCompany } from "./tenancy";
export type { Tenant, Session } from "./tenancy";
export { can } from "./permissions";
export type { PermissionKey, RoleGrants } from "./permissions";
export { PARTY_ROLES, partyLabel } from "./party";
export type { Party, PartyKind, PartyRoleName } from "./party";
export { outstanding } from "./document";
export type { DocStatus, MoneyDoc } from "./document";
export { formatFrom } from "./email";
export type { Mailbox } from "./email";

// Swappable language core (ports & adapters):
export { setLocaleCore, getLocaleCore, hasLocaleCore, __resetLocaleCore } from "./locale";
export type { LocaleCore, Locale, Direction } from "./locale";

// Swappable update core (ports & adapters):
export { setUpdatePort, getUpdatePort, hasUpdatePort, __resetUpdatePort, compareSemver } from "./update";
export type { UpdatePort, PackageVersion, UpdateInfo } from "./update";

// Swappable data source (ports & adapters):
export { setDataSource, getDataSource, hasDataSource, __resetDataSource } from "./data";
export type { DataSource, TenantScope, RawContact, RawCompany, RawLead } from "./data";

// Swappable authentication seam (ports & adapters):
export { setSessionResolver, hasSessionResolver, __resetSessionResolver, resolveSession, currentScope } from "./auth";
export type { SessionResolver } from "./auth";
