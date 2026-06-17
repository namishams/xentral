# Xentral — Architecture Audit (pre-design freeze)

Date: 2026-06-17. Scope: the new modular core (`/var/www/xentral`, `next.xentral.ae`),
with the live monolith (`app.xentral.ae`) as proof of buildable breadth.

## Scores (0–100)
| Dimension | Score | One-line reason |
|---|---|---|
| Architecture quality | 62 | Strong hexagonal foundation; missing event backbone, DB-enforced tenancy, file/search/notify services |
| Production readiness | 25 | Seed skeleton, no auth provider wired, no public API, no real data |
| Scalability | 45 | Foundation supports it; search/reporting/events not built |
| Security | 40 | Tenant isolation by convention (no RLS), vault exists, no immutable audit, file/AV/rate-limit gaps |
| UAE market readiness | 55 | e-invoicing format + Corporate Tax + WPS present; data residency + accredited Peppol ASP missing |

## The three backbones (cannot be retrofitted later)
1. **Domain event bus + outbox** — prerequisite for automations, AI reactions, integrations, plugins, honest audit.
2. **Postgres Row-Level Security** — make tenant isolation a DB guarantee, not a discipline. The scariest single-point-of-failure.
3. **Real auth provider on the SessionPort** — sessions, refresh, revocation, MFA policy. Gates the whole live-data switch.

## Top 25 missing items
Critical: 1) event bus/outbox · 2) Postgres RLS · 3) real auth provider.
High: 4) immutable audit log · 5) file service (S3, signed URLs, AV) · 6) record/field-level permissions · 7) search index (FTS/Meilisearch) · 8) versioned public API + API keys/OAuth + rate limiting · 9) reporting subsystem (read models) · 10) background job queue · 11) observability (logs/metrics/traces/errors) · 12) backup/restore + per-tenant export + DR runbook · 13) AI knowledge/RAG (vector store) · 14) UAE data residency decision · 15) accredited Peppol e-invoicing (ASP).
CRM correctness: 16) Contact↔Account many-to-many + Deal line items + contact roles · 17) Quota/Target object + weighted forecast.
Medium/later: 18) theme engine/ThemePort · 19) plugin UI extension slots · 20) multi-currency + FX · 21) secrets rotation/KMS · 22) webhook signatures + idempotency everywhere · 23) notification service · 24) marketplace legal/escrow separation (PSP, KYC/AML) · 25) custom-objects runtime in the new core.

## Industry ranking (UAE revenue potential)
1. Real Estate (largest, clear workflows: listings, Trakheesi, Form A/B/I, Ejari, commission splits) — build first.
2. Recruitment / Medical staffing (DataFlow/PSV/DHA licensing — real pain, clear willingness to pay; Mediflow exists).
3. Logistics — later.

## 90-day CTO focus
- Weeks 1–4: real auth + Postgres RLS + event bus/outbox + audit log. (Architecture — freeze AFTER these, not before.)
- Weeks 5–8: queue + observability + backups + file service + rate limiting; one vertical (Real Estate) end-to-end on real data behind auth.
- Weeks 9–12: freeze design system; ship Core+CRM on real data; clarify e-invoicing ASP path + data residency.
- Do NOT build: marketplace, developer platform, more modules.

## Decision for us (now)
Design-system work can START in parallel — tokens, components, layout density do not depend on the backbones.
Only the **architecture freeze** (the platform promise) is gated on the three backbones above.
