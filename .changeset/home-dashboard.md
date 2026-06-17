---
"@xentral/config": minor
"@xentral/ui": minor
---

Home dashboard (design start, Xentral-style): added fixed dashboard dimension tokens to
@xentral/config (ui-constants.dashboard) and a locked ActionTile component to @xentral/ui.
Rebuilt /dashboard as greeting + 4 identical KPI tiles + Recommendations/Bookmarks panels +
module action-tile grids (Sales/Inventory/Purchasing/Accounting). Every tile dimension comes
from a token — pixel-consistent by construction.
