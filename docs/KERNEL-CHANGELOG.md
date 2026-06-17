# KERNEL-CHANGELOG\n\nEvery change to packages/kernel or any contract.ts is logged here.\nKernel changes require the owner's explicit approval before merge.\n\n- 2026-06-16 (owner go-ahead): carved typed contracts — tenancy (requireCompany), permissions (can), party (PARTY_ROLES/partyLabel), document (outstanding), email (formatFrom) + money primitive. All pure + tested.\n- 2026-06-16 (owner go-ahead): add swappable LocaleCore port (ports & adapters) — language is now an exchangeable core; default impl @xentral/locale-pack (en+ar, RTL). Profile selects locale.core.
- 2026-06-16 (owner go-ahead): add swappable UpdatePort (ports & adapters) — decoupled per-package updates; default impl @xentral/update-pack (Changesets). Profile selects updates.core.

## 2026-06-17 — CRM contract extended (owner-approved, blanket "bis zum core")
Module: @xentral/module-crm (modules/crm/src/contract.ts) — ADDITIVE only.
Added: listContacts()/ContactRow, listCompanies()/CompanyRow, listLeads()/LeadRow + LeadStage.
Reason: wire the Layer-2 CRM core pages (Contacts, Companies, Leads) to a real contract
instead of seed rows. No kernel change; no breaking change to existing exports
(getDefaultPipeline, listDeals untouched). Vitest coverage added in contract.test.ts.


## 2026-06-17 - Kernel DataPort + CRM async loadContacts (owner-approved)
Kernel: added swappable DataSource port (packages/kernel/src/data.ts) - TenantScope,
RawContact, DataSource, set/get/has/__resetDataSource. Mirrors LocaleCore/UpdatePort.
Module crm: async loadContacts(scope?) reads via the port when a live DataSource is
registered, else seed fallback (safe on public preview). New driver-injected adapter
@xentral/data-pack implements listContacts() against the existing Postgres schema
(read-only), tenant-scoped by companyId. eslint: new 'data' element type.
Reason: Strangler-Fig migration of Contacts (Roadmap Phase 1) - proves seed->live path.


## 2026-06-17 - DataPort listCompanies + CRM loadCompanies (owner-approved)
Kernel: DataSource port gains listCompanies(scope) + RawCompany type (additive).
data-pack: listCompanies reads accounts (tenant-scoped by companyId, openDeals = lead count).
module-crm: async loadCompanies(scope?) via port, seed fallback. /companies -> server component.


## 2026-06-17 - Kernel SessionPort (auth seam, owner-approved)
Added packages/kernel/src/auth.ts: setSessionResolver/resolveSession/currentScope +
SessionResolver type. currentScope() derives TenantScope from the resolved Session
(reusing tenancy.requireCompany). No resolver -> undefined scope -> seed (preview-safe).
Contacts & Companies pages now flow session->scope->data. Identity provider TBD.


## 2026-06-17 - DataPort listLeads + CRM loadLeads (owner-approved)
Kernel DataSource gains listLeads + RawLead. data-pack listLeads reads leads (tenant-scoped, probability->score). module-crm loadLeads (port, seed fallback, stage normalized). /leads -> server component, session-scoped. CRM trias (contacts/companies/leads) now complete on the port pattern.
