---
"@xentral/kernel": minor
"@xentral/module-platform": minor
"@xentral/data-pack": minor
---

Users/Identity migration (Roadmap Phase 1.3): DataPort gains listUsers + RawUser; data-pack
reads the users table (tenant-scoped by companyId); module-platform now consumes the port —
loadUsers (port, seed fallback) + UserRow + kernel dep. /users is a session-scoped server
component. Proves the DataPort pattern generalizes beyond the crm module.
