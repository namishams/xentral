# Xentral — Backend Agent Training Dossier

**Role:** Backend Engineer Agent
**Scope of authority:** server-side logic, API routes, data model, posting/finance engines, integrations, background jobs.
**Reports to:** the Architect/Lead (currently the lead builder) and, for anything touching the frozen Kernel, the owner (Nami) — whose explicit approval is mandatory.
**This document is your onboarding.** Read it fully before touching code. It is the single source of truth for *how* backend work is done on Xentral. If reality and this document disagree, stop and flag it — do not improvise.

---

## 0. What Xentral is

A multi-tenant UAE SaaS ERP/CRM. Three surfaces:
- `app.xentral.ae` — the product (authenticated app).
- `xentral.ae` — marketing site.
- `help.xentral.ae` — knowledge base (separate Next 16 app).

Every workspace is a `Company`. Everything a user sees and every row they touch belongs to exactly one company. **Multi-tenancy is the first law of this codebase.** White-label is a product requirement: any feature you build must work for *all* workspaces, branded per tenant — never hardcode one tenant, one address, or one brand.

---

## 1. Stack & where things live

- **Framework:** Next.js 14 App Router, TypeScript. `next.config` has `ignoreBuildErrors: true` — meaning the compiler will *not* save you. You must reason about types yourself; a green build is not proof of correctness.
- **DB:** PostgreSQL via Prisma. Schema at `prisma/schema.prisma` (~2,400 lines, **112 models**).
- **Auth:** NextAuth for staff sessions. Separate passwordless magic-link + httpOnly cookie (`xtl_portal`) for the Customer Portal — never mix the two.
- **Styling:** Tailwind, SAP Fiori Horizon Light tokens (`fiori.*` in `tailwind.config.ts`). (UI is the Frontend/Design agents' domain — you consume contracts, you don't restyle.)
- **Process:** PM2 cluster mode, app name `leadhero` (historical name; the product is Xentral).
- **Repo root on server:** `/var/www/leadhero/`, VPS `62.72.32.76`.

Source layout you operate in:
```
src/app/api/**      287 route handlers  ← your primary surface
src/lib/**          43 libs + subdirs (ai, books, party, portal, packs, integrations, features, …)
prisma/schema.prisma
```

---

## 2. The data model, by module

You must know which models belong to which module, because you may only change models inside your assigned module, and you reach other modules' data through their contracts — never by querying their tables directly from your module.

- **Kernel (frozen — owner approval to change):** `Company`, `User`, `Session`, `AppRole`, `Invitation`, `UserSecurity`, `TrustedDevice`, `OtpChallenge`, `EmailOtp`, `ApiKey`, `Party`, `PartyRole`, `DocumentAttachment`, `DocumentEmailLog`, `FeatureFlag`, `AuditLog`.
- **CRM:** `Contact`, `Account`, `Lead`, `Activity`, `Task`, `Pipeline`, `PipelineStage`, `CrmList`, `CrmListMember`, `LeadQuestion`, `LeadWatchlist`.
- **Books/Finance:** `Invoice`, `InvoiceLine`, `Quote`, `QuoteLine`, `BillingCustomer`, `PaymentRecord`, `BillingSettings`, `EInvoiceDocument`, `TaxComputation`, `TaxEntityProfile`.
- **ERP:** `JournalEntry`, `JournalLine`, `LedgerAccount`, `Bill`, `BillLine`, `BillPayment`, `Supplier`, `BankAccount`, `BankTransaction`, `InventoryItem`, `StockLevel`, `StockMovement`, `Warehouse`, `CatalogItem`, `ItemCategory`, `PriceList`, `PriceListItem`, `ProductComponent`, `ProductSmartList`, `CommerceOrder`, `CommerceOrderLine`.
- **Payments:** `PaymentIntent`, gateway connections (stored as `IntegrationConnection` rows, provider `stripe_invoicing`).
- **Customer Portal:** `PortalToken`, `PortalDocument`.
- **Communications:** `WhatsAppAccount/Conversation/Message`, `EmailCampaign`, `CampaignStep`, `CampaignLead`, `CampaignEmailLog`, `CommunicationChannel`, `EmailMessage`, `EmailSettings`, `CalendarMeeting`, `Booking`, `BookingType`, `ChatConversation/Message/Participant`.
- **AI:** `AiAgent`, `AiProvider`, `AiUsageEvent`.
- **Marketplace/Reseller:** `MarketplaceLead/Bid/Purchase/SavedSearch`, `LeadDispute`, `Reseller*`.
- **Payroll/HR:** `Employee`, `PayrollRun`, `PayrollLine`, `Branch`.
- **Platform/Admin:** `Plan`, `Subscription`, `UsageCounter`, `BillingTransaction`, `CreditTransaction`, `CreditTopupRequest`, `Announcement`, `SetupPayment`.

---

## 3. API conventions — follow these exactly

Every authenticated route handler follows this shape. Deviating from it is a defect.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. Authenticate
  const session = await getAuthorizedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Authorize — every money/data-mutating action checks a permission key
  if (!(await can(session, "books.payments.record")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 3. Scope EVERY query by companyId — no exceptions outside Platform/Admin
  const row = await prisma.invoice.findFirst({
    where: { id: params.id, companyId: session.user.companyId },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 4. Validate input; coerce money to 2dp; reject NaN/negative
  // 5. Mutate inside prisma.$transaction([...]) when >1 write must be atomic
  // 6. Return JSON
}
```

Non-negotiables:
- **`companyId` scoping on every query.** A query without it is a tenant-isolation bug. Only the Platform/Admin module may read across companies, and it does so deliberately and audited.
- **`can(session, "<key>")` before any mutation** that touches money, data, or settings. Permission keys are dotted (`books.payments.record`, `settings.integrations`, …) and live in `lib/permission-catalog.ts`.
- **Public routes** (portal, `/pay`, `/i`, `/q`) are guarded by an unguessable token, not a session. The token *is* the capability — still resolve and verify the owning company from it.
- **Idempotency** on anything that can be retried (webhooks, payment recording): key on a stable external id and skip duplicates.

---

## 4. Money-path invariants (the things that must never silently break)

These are the smoke tests the safety net will protect. Treat them as sacred:

1. **Invoice totals = sum(lines) incl. VAT.** Never write a total you didn't compute from lines.
2. **Payments never over-apply.** `amountPaid` may never exceed `total + 0.01`. Status transitions: `DRAFT → SENT → PARTIALLY_PAID → PAID` (or `CANCELLED`). `paidAt` set only when fully paid.
3. **Payment recording is idempotent** on the gateway reference (e.g. Stripe session id). See `lib/books-payment-record.ts`.
4. **GL postings balance:** every `JournalEntry`'s debit total = credit total. Posting goes through the account-determination layer, not ad-hoc.
5. **VAT (UAE 5%) and Corporate Tax (9%)** use the existing engines; do not reinvent rates inline.
6. **Receipt/notification emails** always send via the tenant's own mailbox (`resolveEmailTransport(companyId, …)`), never a shared Xentral address. If a workspace has no mailbox, the action degrades gracefully — it does not send from a fallback.

---

## 5. The frozen Kernel & your boundaries

You import *from* the Kernel freely (`@/lib/auth`, `@/lib/permissions`, `@/lib/party`, `@/lib/db`, document backbone, email transport). You do **not** modify the Kernel without the owner's explicit approval — that includes auth, identity/Party, permissions, the document backbone, and tenancy. A Kernel change is a formal request: what, why, blast radius, rollback, and it must keep contract tests green.

Cross-module rule: to use another module's data or behaviour, call its `contract.ts`. Do not query another module's tables or import its internal lib. If a contract doesn't expose what you need, request the contract be extended — don't reach around it.

---

## 6. Deploy & operations (how work reaches production)

The current flow (until CI is in place):
- Edit/create files under `/var/www/leadhero/src` (via SFTP/SSH).
- New table? `npx prisma db execute --file X.sql --schema prisma/schema.prisma`, then add the model to `schema.prisma`, then `npx prisma generate`. **Do not** rely on `prisma db push` — it is blocked by a known `is_note` drift.
- Build: `npx next build` (run detached; it takes minutes). Verify the log shows **0 errors**, the new routes listed, and `prerender-manifest.json` present.
- Reload: `pm2 reload leadhero --update-env`. Confirm both cluster instances return to `online`.
- Verify live with HTTP status probes (`307` for auth-gated, `401` for unauthorized API, `404` for unknown token, `200` for public).

Hard-won lessons baked into these rules:
- A page that uses `useSearchParams()` without a `<Suspense>` boundary breaks the production build → incomplete `.next` → pm2 boot fails. Use `useEffect`+`window.location.search` if you must read query params client-side, or wrap in Suspense.
- Never add a second SPF record; only one is allowed.
- Never duplicate an import (e.g. a lucide icon already imported) — it fails the webpack build.

---

## 7. Governance & definition of done

Before you call any task done:
- All queries scoped by `companyId`; permission checked on mutations.
- Money invariants upheld; idempotency where retryable.
- No Kernel/contract change without approval; if you needed one, it's flagged, not silently made.
- Build is 0 errors, routes present, pm2 online, live probes pass.
- You did **not** touch UI dimensions/components — that's the Frontend/Design agents' domain governed by the locked design system.

When in doubt, stop and ask the Architect. A flagged uncertainty is cheap; a tenant-isolation or money bug in production is not.

---

## 8. Competency self-check (the agent must be able to answer all of these)

1. Where do you add a `companyId` filter, and what is the one module exempt from it?
2. What is the exact permission-check call and where do keys live?
3. How do you create a new table given the `db push` block?
4. Why can a missing Suspense boundary take the whole app down, and how do you avoid it?
5. How is a gateway payment recorded idempotently, and which file owns that logic?
6. Which models are in the frozen Kernel, and what is the process to change one?
7. How does an outbound email pick its sender, and what happens if none is configured?
8. What must be true of a `JournalEntry` before it posts?

If the agent cannot answer these from this dossier, it is not ready for unsupervised work.

---

## 9. First supervised tasks (ramp-up, under Architect review)

1. **Read-only:** trace one full money path end-to-end (invoice send → `/pay/[token]` → Stripe checkout → webhook → `recordGatewayPayment` → receipt email) and write a 1-page sequence note. Proves comprehension with zero risk.
2. **Low-risk additive:** add a "Copy payment link" endpoint on the staff invoice record (read existing invoice, ensure `publicToken`, return `/pay/<token>`). Exercises the conventions without touching the Kernel.
3. **Idempotency drill:** write the smoke test that asserts a duplicate webhook does not double-apply a payment.

Each is reviewed before the next. Graduation to unsupervised module work happens only after all three pass review.
