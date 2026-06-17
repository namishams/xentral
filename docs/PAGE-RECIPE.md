# Recipe — add a page

A page is pure composition of locked `@xentral/ui` components fed by a module contract.

## Scaffold
```
pnpm gen:page <slug> <Title...>      # e.g. pnpm gen:page suppliers Suppliers
```
Creates `apps/web/app/<slug>/page.tsx` (a list page using AppShell + PageTitleRow + FilterBar + DataTable + StatusBadge + EmptyState + Pagination) with seed rows.

## Wire real data
1. Add/extend a module contract, e.g. `modules/<mod>/src/contract.ts` → `export function listX(): XRow[]`.
2. In the page, replace the seed `ROWS` with `import { listX } from "@xentral/module-<mod>"`.
3. Add a `Sidebar` nav entry in `packages/ui/src/app-shell.tsx` and set `<AppShell active="...">`.

## Verify (the guard runs these on commit)
```
pnpm turbo run typecheck lint test     # boundaries + types + unit
cd apps/web && pnpm build              # next build
```
Rules: only `@xentral/ui` components, no hardcoded dimensions, balances/tax via `@xentral/kernel`, every list has loading/empty/error.
