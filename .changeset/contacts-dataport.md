---
"@xentral/kernel": minor
"@xentral/module-crm": minor
"@xentral/data-pack": minor
---

DataPort migration pattern (Roadmap Phase 1): swappable DataSource port in the kernel,
async loadContacts() in module-crm (live via port, seed fallback), and a driver-injected
@xentral/data-pack adapter reading the existing Postgres schema read-only. Contacts page
is now a server component. Public preview stays in safe seed mode until auth lands.
