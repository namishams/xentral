---
"@xentral/kernel": minor
"@xentral/module-crm": minor
"@xentral/data-pack": minor
---

Companies migration (Roadmap Phase 1, Attio-style): DataPort gains listCompanies +
RawCompany; data-pack adapter reads the existing accounts table (tenant-scoped, openDeals
count); module-crm loadCompanies() (live via port, seed fallback); /companies is now a
server component. Same safe seed-on-preview behaviour as Contacts.
