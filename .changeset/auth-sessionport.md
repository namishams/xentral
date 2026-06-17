---
"@xentral/kernel": minor
---

Auth seam (Roadmap Phase 1.3 groundwork): kernel SessionPort — setSessionResolver /
resolveSession / currentScope (ports & adapters). currentScope() derives the TenantScope
from the authenticated Session; no resolver → undefined → safe seed on the public preview.
Contacts & Companies pages now flow session → tenant scope → data. Identity provider next.
