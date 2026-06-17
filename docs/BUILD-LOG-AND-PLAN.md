# Xentral — Exact Build Log & Modular Rebuild Plan
_Generated 2026-06-16 · for the record (Slack + Drive backup)_

This is the precise log of what was done and the exact forward plan, so all four of us (Architect + Backend + Frontend + UX agents) work from one source of truth.

---

## PART A — What was done this session (every step, in order)

### 1. Payment flow — built, deployed, live (multi-tenant)
Goal: payment link → payment received → invoice/receipt emailed automatically. SaaS-ready, not small-office.

Steps taken:
1. Surveyed existing payment infra: `PaymentRecord` model, manual payments route, `lib/payments.ts`, crypto vault (`lib/integrations/crypto.ts`), `resolveEmailTransport`, `buildDocumentEmailHtml`, public `/i/[token]` viewer.
2. Created `lib/books-payment-notify.ts` — `sendInvoiceReceipt(invoiceId)`: branded "payment received" email via the tenant's own mailbox, with view-online link. Best-effort, never breaks the payment.
3. Created `lib/payments-gateway.ts` — per-tenant Stripe: `getTenantStripeKey` (decrypts from vault), `connectStripe` (validates key against Stripe), `disconnectStripe`, `createInvoiceCheckout` (Stripe Checkout session, metadata = companyId/invoiceId/token), `verifyCheckoutSession` (authoritative re-fetch).
4. Created `lib/books-payment-record.ts` — `recordGatewayPayment`: idempotent (keyed on Stripe session id), updates invoice + status, logs activity, fires the receipt email.
5. API routes: `/api/payments/gateway` (connect/disconnect/status), `/api/pay/[token]/checkout` (public, starts checkout), `/api/payments/webhook/stripe` (verifies via tenant key, records payment).
6. Public `/pay/[token]` page (branded; card pay if gateway, else bank-transfer) + `components/pay/pay-actions.tsx`.
7. `/dashboard/payments` connect page + `components/payments/gateway-card.tsx` + sidebar nav.
8. Wired "Pay now" on `/i/[token]` viewer, "Pay" link in portal invoices, hooked `sendInvoiceReceipt` into the manual payments route (so EVERY payment, manual or gateway, emails the customer).
9. Built (0 errors, all 5 new routes present, manifest OK) → `pm2 reload leadhero` → both instances online. Verified live: `/dashboard/payments` 307, `/pay/<unknown>` 404, gateway API 401, webhook POST 200.

To switch on cards per workspace: enter Stripe secret key under Payments + add the Stripe webhook to `https://app.xentral.ae/api/payments/webhook/stripe` (event `checkout.session.completed`).

### 2. Architecture decomposition map (Phase 0)
Surveyed the real system: **~73,000 LOC, 287 API routes, 112 Prisma models**, one Next.js app, one pm2 process. Produced `Xentral-Architecture-Decomposition.md`: frozen Kernel inventory, module catalog, dependency rules, test/CI safety-net plan, agent ownership charter, strict core-governance workflow, migration sequence, risks.

Locked decisions: **in-repo module boundaries** (not microservices), **strict core governance** (every Kernel change needs owner approval), **map-first**.

### 3. Agent dossiers (training)
- `Xentral-Backend-Agent-Dossier.md` — backend agent's full curriculum + operating rules (conventions, money-path invariants, deploy, governance, competency check, first supervised tasks).
- `Xentral-Frontend-Agent-Dossier.md` — pure-frontend agent, aligned to the UI Governance master prompt (locked design system, Action-vs-Tool archetypes, UI checklist, boundaries).

### 4. New modular scaffold on a new path (`/var/www/xentral`)
Proven stack, no reinvented wheel: **pnpm workspaces + Turborepo + Changesets**, Backstage/VS-Code-style plugins, eslint-plugin-boundaries for hard module borders.

Laid down (22 files, additive — live app at `/var/www/leadhero` untouched):
- Root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.changeset/config.json`, `.gitignore`, `README.md`.
- `packages/config` — the locked design system (the gerüst): `design-tokens.ts`, `ui-constants.ts`, `layout.config.ts`, `component-registry.ts`.
- `packages/ui` — locked component library (stub; components migrate here).
- `packages/kernel` — frozen core (stub; contracts migrate here).
- `packages/eslint-config` — module-boundary rules.
- `apps/web`, `modules/`, `plugins/` — placeholders + READMEs.

### 5. Backup
Created source tarball on VPS: `/var/www/backups/xentral-source-20260616-1451.tar.gz` (≈990 KB, src + prisma + scaffold, excludes node_modules/.next/.git). Drive backup folder created in contact@namishams.com Drive.

---

## PART B — The exact forward plan (modular rebuild)

We are NOT adding Xentral features anymore. We rebuild the structure on the new path and export the live app into modules/themes/plugins, with decoupled per-package updates.

**Phase 1 — Gerüst (in progress):** finish the locked design system in `@xentral/config` + migrate the locked components into `@xentral/ui`. Add the 4 missing locked components (PageContainer, DashboardCard, Modal, Pagination). Resolve the 2 reconciliation items (header height 56→64/56; the missing components). Deliver UI Governance contract + checklist.

**Phase 2 — Safety net:** Turborepo pipeline + Changesets + ESLint boundary rule (warn→error) + money-path smoke tests (invoice totals, payment idempotency, GL balance). This is what buys back free time and protects every later change.

**Phase 3 — Carve the Kernel:** move tenancy, identity, auth, party, permissions, document backbone, email transport into `@xentral/kernel` with published contracts + contract tests. Strict: owner approval for any change here.

**Phase 4 — Export modules one at a time** (least-coupled first): Marketing site, Portal, Payments → then CRM, Books, ERP, Comms, AI. Each: relocate → add `contract.ts` → enable its import boundary → green tests.

**Repo Task 1 (the first concrete export task):**
- All **Action pages** (Offer, Invoice, Quote, Customer, Deal, Product…) adopt the fixed bars/header/dimensions from the locked system.
- Separate the **Tool pages** (Chat, WhatsApp, Campaign, Automations, Calendar) as full-bleed tools WITHOUT the standard content bars.

**Phase 5 — Plugins & themes:** convert the Pack Store concept into real manifest-based plugins (e.g. Dubai Real Estate); the design system becomes the theme package.

**Decoupled updates:** Changesets versions each package independently — updating one module never forces updating everything.

**Team:** Architect (me) reviews all; Backend + Frontend agents own their modules; Kernel changes route to the owner. UX agent next.

---

## Governance reminders
- Multi-tenant always: every query scoped by `companyId` (only Platform/Admin crosses workspaces).
- Money invariants are sacred (totals, no over-apply, idempotency, GL balance, VAT/CT, tenant mailbox).
- Frozen Kernel: no change without owner approval, logged in `KERNEL-CHANGELOG.md`.
- Brand identity untouched; no hardcoded dimensions; reuse locked components, never duplicate.
