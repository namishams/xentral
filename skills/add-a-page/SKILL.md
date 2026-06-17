---
name: add-a-page
description: Add a new page to apps/web from locked components. Use when the user asks to create a list page, record page, or any new screen in the Xentral modular app (/var/www/xentral). Wraps the page scaffolder + the locked design system.
owner: frontend-agent
---

# Skill: add a page

Pages are pure composition of `@xentral/ui` locked components fed by a module contract. Never inline a header, table, or badge; never hardcode dimensions.

## 1. Scaffold
```
cd /var/www/xentral
pnpm gen:page <slug> "<Title>"        # e.g. pnpm gen:page suppliers "Suppliers"
```
This writes `apps/web/app/<slug>/page.tsx` — a list page using AppShell · PageTitleRow · FilterBar · Input · Button · DataTable · StatusBadge · EmptyState · Pagination, with seed rows.

## 2. Wire real data through a contract
- Extend the owning module's contract: `modules/<mod>/src/contract.ts` → `export function listX(): XRow[]` (+ a vitest test).
- In the page, replace the seed `ROWS` with `import { listX } from "@xentral/module-<mod>"`.
- If the page needs another module's data, import only its `contract` — never internals (the boundary lint blocks it).

## 3. Wire navigation
- Add a `NAV` entry in `packages/ui/src/app-shell.tsx` and set `<AppShell active="<id>">`.
- For a Tool page (chat/inbox/canvas) use `<AppShell fullBleed>` and bring your own toolbar (no PageTitleRow/QuickActionsBar).

## 4. Verify (mandatory — the pre-commit guard runs these)
```
pnpm turbo run typecheck lint test
cd apps/web && pnpm build
```
All must be green. Then `git commit` — the pre-commit hook re-runs typecheck + boundaries and blocks red.

## Rules
- Only `@xentral/ui` components. Dimensions only from `@xentral/config`.
- Money/VAT via `@xentral/kernel` (`outstanding`, `applyPayment`) — never compute inline.
- Every list view implements loading / empty (EmptyState) / error.
- Archetype: list & record → Action (PageContainer); chat/whatsapp/campaign → Tool (fullBleed).
