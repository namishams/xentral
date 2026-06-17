# Xentral — Architecture Decomposition & Agent-Readiness Plan

**Status:** v1 — System map and target architecture
**Decisions locked with the owner (Nami):**
- Isolation depth → **In-repo module boundaries** (one deployable, enforced borders). No microservice rewrite.
- Core governance → **Strict.** Every change to the frozen Kernel requires the owner's explicit approval.
- First step → **System map + this document**, before any restructuring.

---

## 1. Why we are doing this

Xentral today is a single Next.js application — roughly **73,000 lines** of TypeScript, **287 API routes**, **112 database models**, deployed as **one pm2 process**. Everything can import everything. That was the right call for speed while one builder (me) held the whole picture in mind.

The moment we put several role-based agents (backend, frontend, UX, designer, …) on the same uncontrolled codebase, the risk inverts: a CRM change can silently break the payment core, a token tweak can break the invoice PDF, and nothing shouts "stop." **More agents on an ungoverned monolith means faster breakage, not more free time.**

The free time you want comes from three things, in this order: a **frozen Kernel**, **enforced module boundaries**, and a **test + CI safety net**. Agents come *after* those exist. This document defines all three and the order to build them.

---

## 2. Target shape in one picture

```
                        ┌──────────────────────────────────────────┐
                        │                FROZEN KERNEL               │
                        │  (change-controlled — owner approval only) │
                        │                                            │
                        │  Tenancy · Identity · Auth · Permissions   │
                        │  Party model · Document backbone           │
                        │  Entitlements/Features · Design tokens     │
                        │  DB client · i18n · Email transport · Brand│
                        └───────────────▲───────────────▲───────────┘
                                        │ contracts only │
        ┌───────────────┬──────────────┼───────────────┼──────────────┬───────────────┐
        │               │              │               │              │               │
     ┌──┴──┐         ┌──┴──┐        ┌──┴──┐         ┌──┴──┐        ┌──┴──┐         ┌──┴──┐
     │ CRM │         │Books│        │ ERP │         │Pay- │        │Portal│        │Comms│  …
     │     │         │/Fin │        │     │         │ments│        │      │        │     │
     └─────┘         └─────┘        └─────┘         └─────┘        └──────┘        └─────┘
   Modules talk to the Kernel and to each other ONLY through published contracts
   (typed service interfaces + domain events). Never by reaching into internals.
```

One repo, one deploy. The borders are enforced by folder structure + import-lint rules + contract tests — not by servers.

---

## 3. The Frozen Kernel (change-controlled)

These are the foundations every module depends on. They change rarely, and only with your explicit sign-off. Each gets a **published contract** (a small, stable, typed public API) and **contract tests** that fail loudly if the shape changes.

| Kernel area | What it owns | Today's files (representative) |
|---|---|---|
| **Tenancy & Identity** | `Company`, `User`, `Session`, `AppRole`, `Invitation`, `UserSecurity`, `TrustedDevice`, `OtpChallenge`, `EmailOtp`, `ApiKey` | `lib/auth.ts`, `lib/identity.ts` |
| **Permissions & Entitlements** | `can()`, permission catalog, `FeatureFlag`, per-plan/per-user feature locks | `lib/permissions.ts`, `lib/permission-catalog.ts`, `lib/features/` |
| **Party model** | `Party`, `PartyRole` — the unified person/organisation identity that CRM, Books, ERP all resolve against | `lib/party/` |
| **Document backbone** | `DocumentAttachment`, `DocumentEmailLog`, shared numbering/totals/PDF-data builders, email-open tracking | `lib/books-doc.ts`, parts of `lib/books-email.ts` |
| **Email transport** | Per-tenant mailbox resolution (never a shared address), branded email shell | `lib/channels.ts` (`resolveEmailTransport`), `lib/email.ts` |
| **Design system** | Tokens, `components/ui/*`, global styles, brand constants | `components/ui/`, `app/globals.css`, `lib/brand.ts` |
| **Platform infra** | DB client, rate-limit, recaptcha, i18n, currencies, utils, version | `lib/db.ts`, `lib/rate-limit.ts`, `lib/recaptcha.ts`, `lib/i18n*`, `lib/currencies.ts`, `lib/utils.ts`, `lib/version.ts` |

**Rule:** modules import *from* the Kernel freely. The Kernel imports *nothing* from a module. If the Kernel ever needs something a module has, that something belonged in the Kernel — we promote it (with your approval), we don't reach down.

---

## 4. Module catalog

Each module owns a slice of routes, a slice of `lib`, its components, and a defined set of database models. It exposes a **contract** (`modules/<name>/contract.ts`) — the only surface other modules may use.

| Module | Owns (models) | Routes / libs | Notes |
|---|---|---|---|
| **CRM** | Contact, Account, Lead, Activity, Task, Pipeline, PipelineStage, CrmList, CrmListMember, LeadQuestion, LeadWatchlist | `app/dashboard/{contacts,accounts,deals,leads,pipeline,funnel,tasks}`, `app/crm`, `lib/lead-intelligence.ts` | Largest module. Resolves people via Party contract. |
| **Books / Finance** | Invoice, InvoiceLine, Quote, QuoteLine, BillingCustomer, PaymentRecord, BillingSettings, EInvoiceDocument, TaxComputation, TaxEntityProfile | `app/dashboard/books`, `app/books`, `app/i`, `app/q`, `lib/books*`, `lib/books-pdf.ts` | Document-heavy. Uses Document backbone + Party. |
| **ERP** | JournalEntry, JournalLine, LedgerAccount, Bill, BillLine, BillPayment, Supplier, BankAccount, BankTransaction, InventoryItem, StockLevel, StockMovement, Warehouse, CatalogItem, ItemCategory, PriceList, PriceListItem, ProductComponent, ProductSmartList, CommerceOrder, CommerceOrderLine | `app/dashboard/{purchases,documents,o2c,p2p}`, `lib/books/` (posting), industry packs | GL/AP/banking/inventory/commerce. Posts via account-determination contract. |
| **Payments** | PaymentIntent, BillingTransaction (gateway side), gateway connections | `app/pay`, `app/api/pay`, `app/api/payments`, `lib/payments-gateway.ts`, `lib/payments.ts`, `lib/books-payment-*.ts` | Per-tenant Stripe/Telr. Just shipped. Records onto Books invoices via contract. |
| **Customer Portal** | PortalToken, PortalDocument | `app/portal`, `app/api/portal`, `app/book`, `lib/portal/` | Magic-link, white-label. Read-only views over Books/CRM via contracts. |
| **Communications** | WhatsAppAccount, WhatsAppConversation, WhatsAppMessage, EmailCampaign, CampaignStep, CampaignLead, CampaignEmailLog, CommunicationChannel, EmailMessage, EmailSettings, CalendarMeeting, Booking, BookingType, ChatConversation, ChatMessage, ChatParticipant | `app/dashboard/{whatsapp,campaigns,calendar,chat,email,scheduling}`, `lib/channels*`, `lib/booking.ts` | Outbound + scheduling + internal chat. |
| **AI** | AiAgent, AiProvider, AiUsageEvent | `app/dashboard/{ai,mission-control}`, `app/ai`, `app/api/ai`, `lib/ai/` | Action registry calls module contracts, never internals. BYOK + metering. |
| **Marketplace & Reseller** | MarketplaceLead, MarketplaceBid, MarketplacePurchase, MarketplaceSavedSearch, LeadDispute, ResellerLead, ResellerProfile, ResellerPayout | `app/dashboard/{marketplace,partner}`, `app/reseller`, `lib/marketplace.ts` | Lead exchange + partner payouts. |
| **Payroll / HR** | Employee, PayrollRun, PayrollLine, Branch | `app/dashboard/{people,team,org}`, `app/dashboard/books/payroll` | WPS .SIF. Could merge into ERP later. |
| **Developer / API** | ApiKey (shared with Kernel auth), DeveloperProfile, DeveloperWebhook | `app/dashboard/developer`, `app/api/developer` | Public REST + webhooks + white-label. |
| **Packs / Plugin Store** | (config-driven, catalog in code) | `app/dashboard/store`, `lib/packs/` | Installable packs (e.g. Dubai Real Estate). The in-product analogue of this whole initiative. |
| **Platform / Admin** | Plan, Subscription, UsageCounter, BillingTransaction, CreditTransaction, CreditTopupRequest, AuditLog, Announcement, SetupPayment | `app/admin`, `app/api/admin`, `lib/billing*.ts`, `lib/usage.ts` | Cross-tenant. The only module allowed to read across workspaces. |
| **Marketing site** | (no app DB writes) | `app/{about,pricing,solutions,product,blog,why-dubai,…}`, `components/landing/` | Public, SEO. Reads nothing tenant-private. |
| **Knowledge Base** | separate Next 16 app (help.xentral.ae) | — | Already physically separate. Lowest coupling. Good template for "frozen". |

---

## 5. Dependency rules (the heart of it)

1. **Kernel → nothing.** The Kernel never imports a module.
2. **Module → Kernel:** always allowed.
3. **Module → Module:** allowed **only** via the other module's `contract.ts`. Importing another module's pages, internal lib, or Prisma calls directly is forbidden.
4. **Cross-module data flow** that isn't a simple call goes through **domain events** (e.g. `payment.received` → Books marks paid → ERP posts to GL → Comms emails receipt). One emitter, many listeners, no tangles.
5. **Tenancy is non-negotiable:** every query in every module is scoped by `companyId`. Only the Platform/Admin module may cross workspaces.

**How it is enforced (not just documented):**
- Folder layout makes ownership obvious: `src/modules/<name>/{routes,lib,components,contract.ts}` with the Kernel in `src/kernel/`.
- An **ESLint import-boundary rule** (`eslint-plugin-boundaries` or `no-restricted-imports`) fails the build if a file imports across a forbidden border. This is the wall an agent physically cannot climb.
- **CODEOWNERS** maps each module folder to an owner (human or, later, an agent role). The Kernel is owned by you.

---

## 6. The safety net — tests + CI (the real free-time lever)

Today, "build passes with 0 errors" only proves it compiles. It does not prove the invoice total is right or that a payment can't be double-applied. Before agents, we add:

- **Contract tests** on the Kernel and each module contract — they fail the moment a published shape changes, which is exactly when you want to be asked for approval.
- **Smoke tests** on the money paths first: invoice totals/VAT, payment recording (incl. idempotency), GL postings balance, PDF renders, magic-link auth scoping. These are the things that must never silently break.
- **A CI pipeline** (GitHub Actions or VPS-side) that runs typecheck → lint (incl. import boundaries) → tests → build on every change, and blocks deploy on red.
- **Seed/fixture workspace** so tests run against realistic multi-tenant data.

This is what lets me — and later the agents — change things safely and unattended.

---

## 7. Agent-role ownership charter (the end state)

Once boundaries + tests exist, roles map cleanly onto modules. Each role gets write access to its modules only; the Kernel stays yours.

| Agent role | Owns | May read (contracts) | May NOT touch |
|---|---|---|---|
| **Architect / Lead** (me, until handover) | nothing exclusively — reviews all | everything | makes no Kernel change without your OK |
| **Backend** | ERP, Books posting, Payments server, APIs | Kernel, all module contracts | UI/design tokens |
| **Frontend** | module pages & client components | contracts, design system | Kernel logic, posting engines |
| **Designer** | design system tokens & `components/ui` (proposes; Kernel-adjacent → your OK) | all UI | business logic, DB |
| **UX** | flows, empty/loading/error states, copy | all | DB schema, posting |
| **CRM specialist** | CRM module | Party, Comms, Books contracts | other modules' internals |
| **Finance specialist** | Books + ERP + Tax | Party, Payments contracts | CRM/Comms internals |

The Architect role is the gatekeeper that turns "an agent wants to change the Kernel" into "a request that lands on your desk."

---

## 8. Strict core-governance workflow (your decision, made concrete)

Any change that touches `src/kernel/**` or a `contract.ts`:

1. Is proposed as an explicit **Kernel Change Request** — what, why, blast radius, rollback.
2. Cannot be merged/deployed until **you approve it**. CI enforces this: Kernel paths require the owner's sign-off (CODEOWNERS + branch protection).
3. Must keep all contract tests green.
4. Is logged in a `KERNEL-CHANGELOG.md` so the frozen core has an auditable history.

Everything *inside* a module, behind its contract, agents (and I) can change freely — that is where velocity lives. The Kernel is small on purpose so that "needs your approval" stays rare.

---

## 9. Migration sequence (how we get there without breaking live)

This is additive and reversible — the app keeps running throughout.

- **Phase 0 — Map (done):** this document.
- **Phase 1 — Safety net first:** stand up CI + the money-path smoke tests against the current layout. Nothing moves yet; we just gain the net.
- **Phase 2 — Carve the Kernel:** create `src/kernel/`, move the foundational files in, publish their contracts + contract tests. High-value, low-risk (mostly relocation + re-export shims so nothing breaks).
- **Phase 3 — Draw module borders one at a time:** start with the **least-coupled** modules (Marketing site, Portal, Payments — all young and clean) to prove the pattern, then the harder ones (CRM, Books, ERP). Each move: relocate → add `contract.ts` → turn on the import-boundary rule for that border → green tests.
- **Phase 4 — Turn on enforcement globally:** import-boundary lint from "warn" to "error", CODEOWNERS + branch protection on the Kernel.
- **Phase 5 — Agent onboarding:** write each role's brief, scope its access to its module folders, run the first agent on a low-risk module under the Architect review gate.

We can pause after any phase and still have a better system than before.

---

## 10. Honest risks & limits

- **I am not a substitute for tests.** Across long sessions I lose context and can regress things. The safety net (Phase 1) is what actually protects you — please don't let us skip it for speed.
- **Refactor risk.** Moving 73k LOC into folders can break imports. We mitigate with re-export shims and one-module-at-a-time moves, each behind green CI.
- **Boundary erosion.** Borders only hold if enforced in CI. A documented-but-unenforced rule is decoration. Phase 4 is not optional.
- **Coupling reality.** CRM ↔ Books ↔ ERP are genuinely intertwined (a customer is a Party is an account is a billing customer). Expect the Party and Document contracts to need the most care — that is exactly why they sit in the Kernel.
- **Solo-until-agents is fine for module work; risky for Kernel work.** Kernel changes are where a second pair of eyes (yours, via the approval gate) matters most.

---

## 11. What I recommend we do next

Per your decision, the map (Phase 0) is done. The highest-leverage next move is **Phase 1 — the safety net** (CI + money-path smoke tests on the current code), because it protects everything that follows and starts buying back your time immediately. I can begin that whenever you give the word, and report back before turning any enforcement to "error".
