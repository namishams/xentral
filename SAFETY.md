# Xentral — Production Safety & Deployment Guard

No single code change (human or AI) can take the whole app down. Every layer
either gates a bad change before it ships, or degrades gracefully if something
slips through. **Xentral never shows a full 500 because one module failed.**

## 1. Branch flow — no direct production deploys
```
feature/**  ->  preview  ->  staging  ->  production (main)
```
- `.github/workflows/safe-deploy.yml` runs the `verify` gate on every push/PR
  (typecheck + boundaries lint + migration safety + build + smoke).
- `production` is a GitHub **Environment with required reviewers** = manual
  approval. Protect `main`: require PR + the `verify` check.
- On the box, `scripts/deploy-guard.sh` refuses a direct `main` deploy unless
  `ALLOW_PROD_DEPLOY=1` is set (CI sets it after approval).

## 2. Health endpoint — `GET /api/health`
Single source of truth. Checks: app, **database**, **auth** config, required
**env**, **storage** write access, **payment** (if enabled), **whatsapp** (if
enabled). Returns `200` healthy/degraded, `503` unhealthy. Used by the smoke
gate and the auto-rollback guard.

## 3. Smoke tests — `scripts/smoke-test.sh`
Hits the critical routes (`/auth/login`, `/`, `/dashboard`, `/contacts`,
`/companies`, `/leads`, `/deals`) and `/api/health`. **Any failure aborts the
deploy.** Run automatically by `deploy-guard.sh` and in CI.

## 4. Module error boundaries — never crash the whole app
- `app/global-error.tsx` — root fallback (calm page, never a raw 500).
- `app/error.tsx` — segment fallback card.
- `<ModuleBoundary name="...">` (from `@xentral/ui`) — wrap any module subtree;
  a crash inside shows **"Module temporarily unavailable."** and the rest of
  Xentral keeps working. Failures POST to `/api/safety/log`.

## 5. Feature flags — new modules OFF by default
`apps/web/lib/flags.ts`. New/experimental modules ship disabled and are enabled
manually with `FLAG_<KEY>=1`. A module also auto-disables if its required env is
missing. Inspect current flags in the `features` array of `/api/health`.

## 6. Rollback — `scripts/rollback.sh` + auto-rollback
`deploy-guard.sh` records the last known-good ref in `.last-good-ref`. After a
deploy it runs the health + smoke gates; if either fails it **automatically
rolls back** to the previous good build (checkout → rebuild → restart → re-check).

## 7. Migration safety — `scripts/migration-check.sh`
Scans SQL changed since the last good ref for destructive statements
(`DROP TABLE/COLUMN/…`, `TRUNCATE`, `DELETE FROM`, destructive `ALTER`). These
are **blocked** unless `MIGRATION_APPROVED=1` is set explicitly. Destructive
migrations are never run automatically in production.

## 8. Environment validation — `apps/web/lib/env.ts`
Validated at boot (`instrumentation.ts`). Missing **required** vars
(`DATABASE_URL`, `XENTRAL_SESSION_SECRET`) are logged loudly and the app runs
degraded; missing **optional module** vars simply disable that module instead of
crashing the app.

## 9. Logging — `logs/safety.log` (+ stdout)
Every failed deploy, failed health check, failed module load and rollback is
appended as a JSON line by `apps/web/lib/safety-log.ts` and the shell `slog`
helper. `pm2 logs xentral-next` also captures them.

## 10. Result — graceful degradation
Bad build → caught by `verify`/`deploy-guard`, prod untouched. Bad runtime →
health/smoke gate fails → auto-rollback. Module exception → boundary fallback
card. Missing config → module disabled, app stays up.

---
### How to deploy safely (VPS)
```bash
cd /var/www/xentral && git pull
ALLOW_PROD_DEPLOY=1 bash scripts/deploy-guard.sh      # build→restart→health→smoke→(auto-rollback)
```
### Enable a new module
```bash
pm2 set xentral-next:env FLAG_CLOUD_EXPORT 1   # or export FLAG_CLOUD_EXPORT=1 before restart
pm2 restart xentral-next --update-env
```
### Approve a destructive migration (rare, manual)
```bash
MIGRATION_APPROVED=1 ALLOW_PROD_DEPLOY=1 bash scripts/deploy-guard.sh
```
