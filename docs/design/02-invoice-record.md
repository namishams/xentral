# Page spec — Invoice record (Action archetype reference) · LOCKED 2026-06-16

The reference all record pages inherit (Quote, Customer, Deal, Product) — only content/columns change.

## Regions (top → bottom)
1. **GlobalHeader** — 64/56, sticky, AISearchBar centred (same on every page).
2. **PageTitleRow** — breadcrumb (Invoices › #1043) + title 20px + status badge; primary action `Send` right.
3. **QuickActionsBar** — 48px, ≤5 + More: Record payment · PDF · Duplicate · Pay link · More. Buttons 36px, gap 8, icon 16.
4. **Content grid — 2/3 : 1/3**, gap 16:
   - **Left (2/3):** the document — bill-to + issue/due block; line-item DataTable (header 44, rows 48); totals right-aligned (Subtotal, VAT 5%, Total, Paid, **Balance due** bold).
   - **Right (1/3):** summary card (Balance due big + due date + Copy pay link) ; Activity timeline (Sent → Viewed → Paid).

## Frame
content max 1440 · padding 32/24/16 · section gap 24 · card gap 16 · radius 10.

## Notes
- Locked components: GlobalHeader, AISearchBar, PageTitleRow, QuickActionsBar, DataTable, DetailDrawer, StatusBadge.
- Loading/empty/error states on every card; totals computed via kernel money (`outstanding`, `applyPayment`) — never ad-hoc.
- AI entry point optional on record pages (right column) — confirmed direction; small, not a hero.
