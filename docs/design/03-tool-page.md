# Page spec — Tool page (Tool archetype reference) · LOCKED 2026-06-16

The reference for full-bleed immersive tools: WhatsApp, Team chat, Campaign builder, Automations canvas, Calendar.

## Defining traits
- Sits under the **GlobalHeader (64/56)** — the only shared chrome.
- **No PageTitleRow. No QuickActionsBar.** No content max-width clamp.
- Fills the viewport height; the tool brings its **own internal toolbar**.

## Layout (WhatsApp example — 3 pane)
1. **Conversation list** — fixed 320px: search + filter, rows (avatar, name, preview-truncate, time, unread dot).
2. **Active thread** — flex: thread header (contact + presence + actions) · message area (incoming left / outgoing accent-right) · **sticky composer** (attach + input + send) docked at bottom.
3. **Context panel** — 280px, collapsible: contact identity + linked CRM (invoice, deal, KYC) + quick actions.

## Notes
- Each tool defines its own toolbar; it never borrows PageTitleRow/QuickActionsBar.
- Uses locked primitives where applicable (Button, Input, EmptyState, DetailDrawer for context).
- AI: the header AISearchBar may act in-context ("reply with a payment link").
- Loading/empty/error states per pane (empty inbox, no thread selected, send failure).

---

# Layout foundation — COMPLETE
Three archetype references locked: `01-dashboard` (Action/landing) · `02-invoice-record` (Action/record) · `03-tool-page` (Tool). Every future page inherits one of these. Real page/logic migration now targets these locked layouts.
