# AI-Agent Build Plan — TEMPLATE
_The reusable blueprint. This document + the profile manifest + the compliance plugin are everything needed to spin up a new architecture version (e.g. a UAE-conform instance) in one step. Keep it clean and current until the architecture is finished._

> **How to read this:** anything in `{{double-braces}}` is a variable filled from a **profile** (`profiles/<name>.profile.json`). The plain text is fixed methodology that every version inherits.

---

## 0. What this template produces

A multi-tenant SaaS ERP/CRM, built as a **pnpm + Turborepo monorepo** with a **frozen kernel**, **contract-bounded modules**, **manifest plugins**, a **locked design system**, and a roster of **role-based AI agents** that build and maintain it under strict governance.

A new version = pick/author a **profile**, run the generator, attach the matching **compliance plugin**. Nothing about the methodology changes between versions — only the profile values and the compliance pack.

---

## 1. One-click instantiation (the mechanism — proven tools only)

1. **The monorepo is the template.** Clone it (or `turbo gen` from it).
2. **A profile manifest** declares everything version-specific: identity, region, locale, currency, tax/compliance, modules, design theme, agent roster. See `profiles/_schema.md` and the worked example `profiles/uae.profile.json`.
3. **`turbo gen architecture --profile <name>`** (Turborepo's built-in generator) reads the profile and scaffolds: app identity, enabled module packages, the compliance plugin wiring, locale/RTL, theme tokens, and the agent dossiers (rendered from this template with the profile's variables).
4. **Compliance is a plugin**, not core. A region = swap `plugins/compliance-{{region}}`. This keeps the kernel region-neutral and makes "VAE-conform", "KSA-conform", "EU-conform" interchangeable packs.

Result: one command → a new, correctly-scoped architecture instance with its agents pre-briefed.

---

## 2. Fixed methodology (inherited by every version)

### 2.1 Layers
- **Kernel (frozen):** tenancy, identity, auth, permissions/entitlements, the unified Party model, document backbone, email transport, design-token contract. Change only with owner approval; logged in `KERNEL-CHANGELOG.md`.
- **Modules (contract-bounded):** each business domain is a package exposing only `contract.ts`. Cross-module access via contracts or domain events — never internals.
- **Plugins (manifest-based):** installable contributions (routes, nav, theme, hooks). Compliance packs, industry packs, marketplaces.
- **Design system (locked):** `@xentral/config` tokens + `@xentral/ui` components. No hardcoded dimensions; reuse, never duplicate; two page archetypes (Action / Tool).

### 2.2 Non-negotiable invariants
- **Multi-tenant:** every query scoped by tenant id; only a Platform/Admin module crosses tenants.
- **Money paths sacred:** document totals computed from lines; no over-application of payments; gateway recording idempotent; ledger entries balance; tax from the compliance pack, never inline.
- **Per-tenant identity:** emails/branding from the tenant, never a shared address; white-label by default.
- **Boundaries enforced in CI** (eslint-plugin-boundaries), not just documented.

### 2.3 Safety net before agents
Turborepo pipeline + Changesets (decoupled per-package versioning) + boundary lint + money-path smoke tests. Agents only run unsupervised after this exists.

---

## 3. The agent roster (each rendered from a dossier template)

| Agent | Owns | May change | Must never touch | Dossier |
|---|---|---|---|---|
| **Architect / Lead** | nothing exclusively; reviews all; gatekeeps the kernel | review + orchestrate | bypass owner approval for kernel | this file |
| **Backend** | server logic, APIs, posting/finance engines, integrations | its modules | UI tokens, kernel (without approval) | `agents/backend.md` |
| **Frontend** | pages, client components, presentation | its modules' UI | backend logic, kernel, design tokens | `agents/frontend.md` |
| **UX** | flows, states, copy, accessibility | UX of any module | DB schema, posting logic | `agents/ux.md` _(next)_ |
| **Export/Build Assistant** (Architect's deputy) | mechanical extraction into modules/themes/plugins; release tooling | scaffolding, Changesets, boundary checks | business logic decisions | `agents/export-assistant.md` |

Governance: every agent has write access to its folders only (CODEOWNERS); kernel changes route to the owner. Each agent must pass its dossier's competency self-check before unsupervised work, and ramp via supervised tasks.

---

## 4. Build phases (the sequence every version follows)

- **Phase 0 — Map:** inventory the source (LOC, routes, models); produce the architecture decomposition.
- **Phase 1 — Gerüst:** finish the locked design system (`@xentral/config`) + migrate locked components to `@xentral/ui`; resolve reconciliation items.
- **Phase 2 — Safety net:** Turborepo + Changesets + boundary lint + money-path smoke tests + CI.
- **Phase 3 — Carve the kernel:** move foundations into `@xentral/kernel` behind contracts + contract tests.
- **Phase 4 — Export modules** least-coupled first, one at a time: relocate → `contract.ts` → enable boundary → green tests.
- **Phase 5 — Plugins & themes:** convert packs to manifest plugins; attach the profile's **compliance plugin**; theme from tokens.
- **Repo Task 1 (first export task):** Action pages adopt fixed bars/dimensions; Tool pages separated as full-bleed.

Each phase is reversible and leaves the system better than before.

---

## 5. Profile variables (filled per version)

`{{product.name}}`, `{{product.appDomain}}`, `{{region.code}}`, `{{region.compliancePlugin}}`,
`{{locale.default}}`, `{{locale.rtl}}`, `{{currency.default}}`,
`{{tax.vatRate}}`, `{{tax.corporateTaxRate}}`, `{{tax.eInvoiceStandard}}`, `{{payroll.standard}}`,
`{{modules.enabled[]}}`, `{{theme.tokensRef}}`, `{{agents.enabled[]}}`, `{{dataResidency}}`.

See `profiles/uae.profile.json` for the worked example.

---

## 6. Definition of "documented & done" (maintained until architecture is finished)
- This template current; `profiles/` has at least one complete profile.
- Every agent has a dossier with competency check + supervised ramp tasks.
- `ARCHITECTURE.md` (decomposition) + `KERNEL-CHANGELOG.md` present.
- Boundary rules enforced in CI; money-path smoke tests green.
- A new version can be produced from a profile + compliance plugin without editing methodology.
