---
name: verify-and-ship
description: Verify and deploy a change in the Xentral modular monorepo (/var/www/xentral). Use after any code change before declaring it done — runs the safety net (typecheck, module boundaries, tests, build), then deploys the build console and confirms it is live.
owner: export-assistant
---

# Skill: verify and ship

The safety net is mandatory. Nothing is "done" until it is green and live.

## 1. Verify the whole monorepo
```
cd /var/www/xentral
pnpm turbo run typecheck lint test
```
- `typecheck` — every package compiles.
- `lint` — eslint-plugin-boundaries (error): kernel imports no module; modules reach others only via `contract.ts`; pages import only `@xentral/ui`. A violation here is a real architecture bug — fix it, don't suppress.
- `test` — vitest (money-path invariants, contracts).

## 2. Build the app
```
cd apps/web && pnpm build      # next build; must show 0 errors and your route listed
```
Common real failures this catches: token literals (`as const`) needing an explicit state type; a contract not re-exported from a package index; a missing workspace dependency.

## 3. Deploy + confirm live
```
pm2 restart xentral-next --update-env
curl -s -o /dev/null -w '%{http_code}' https://next.xentral.ae/<route>     # expect 200
```
Order matters: build → pm2 restart → commit. Between "build done" and "pm2 restart" a new route briefly 404s — that is expected, not a bug.

## 4. Commit (independent updates)
```
git add -A && git commit -m "..."      # pre-commit guard re-runs typecheck + lint
pnpm changeset                          # record which packages changed (decoupled releases)
```

## Governance
- Never touch `/var/www/leadhero` (the production app) except read-only.
- Kernel (`packages/kernel`) or any `contract.ts` change → flag for owner approval, log in `docs/KERNEL-CHANGELOG.md`.
- If a build/lint failure is unclear, stop and report — a flagged uncertainty is cheap; a regression is not.
