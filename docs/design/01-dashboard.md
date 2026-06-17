# Page spec — Mission Control (Dashboard) · LOCKED 2026-06-16

Archetype: **Action**. Reference page for the landing/overview style. All dimensions from `@xentral/config`.

## Regions (top → bottom)
1. **GlobalHeader** — 64px desktop / 56 mobile, sticky. Left: brand. Centre: AISearchBar (420–520 × 40). Right: notifications, settings, avatar.
2. **PageTitleRow** — title "Mission control" (20px) + greeting/date subtitle; primary action `+ New` right.
3. **AI centrepiece** — full-width block directly under the title (the heart). "Ask Xentral AI" + 4 action chips that trigger real actions: Draft an invoice · This week's pipeline · Who's overdue? · Create a task. Accent: info/blue.
4. **KPI row** — 4 × KPI tile (112px, min 220 / max 320), one row desktop / 2 tablet / 1 mobile:
   - Revenue MTD · Outstanding (count) · Open deals (value) · Tasks today (overdue flag).
5. **Content grid — 2/3 : 1/3**, gap 16:
   - **Left (2/3):** "Needs attention" list (overdue invoices, stalled deals, pending KYC) + Order-to-Cash mini-board (leads → quotes → invoices → paid).
   - **Right (1/3):** "Today" (meetings + tasks) + one AI insight card.

## Frame
content max 1440 (1600 large) · page padding 32/24/16 · section gap 24 · card gap 16 · radius 10.

## Notes
- AI is the visual centrepiece, not just the header search.
- Every card implements loading (Skeleton) / empty (EmptyState) / error states.
- Locked components only: GlobalHeader, AISearchBar, PageTitleRow, KPICard, DashboardCard, EmptyState.
