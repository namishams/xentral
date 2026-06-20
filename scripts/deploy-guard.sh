#!/usr/bin/env bash
# Production deploy guard. Orchestrates the safe path:
#   migration-check -> build -> restart -> health gate -> smoke gate
# On ANY post-deploy failure it auto-rolls back to the last known-good ref.
# Direct production deploys are refused unless ALLOW_PROD_DEPLOY=1.
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "$DIR/_safety.sh"
cd "$SAFETY_ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
NEW_REF="$(git rev-parse --short HEAD)"
LAST_GOOD="$(cat .last-good-ref 2>/dev/null || echo "$NEW_REF")"
slog info deploy "Deploy guard start: branch=$BRANCH new=$NEW_REF lastGood=$LAST_GOOD"

# 1) No accidental direct production deploy
if [ "$BRANCH" = "main" ] && [ "${ALLOW_PROD_DEPLOY:-0}" != "1" ]; then
  echo "REFUSED: direct deploy on 'main'. Use branch->staging flow, or set ALLOW_PROD_DEPLOY=1."
  slog error deploy "Refused direct prod deploy on main (no ALLOW_PROD_DEPLOY)"; exit 1
fi

# 2) Migration safety
bash "$DIR/migration-check.sh" || { slog error deploy "Aborted: migration check failed"; exit 1; }

# 3) Build (production untouched if this fails)
echo "Building…"
if ! pnpm -w build >/tmp/deploy-build.log 2>&1; then
  slog error deploy "Build FAILED — production left untouched"; echo "BUILD FAILED — aborting, prod unchanged"; tail -5 /tmp/deploy-build.log; exit 1
fi

# 4) Restart onto new build
export XENTRAL_BUILD_REF="$NEW_REF"
pm2 restart xentral-next --update-env >/dev/null 2>&1
sleep 5

# 5) Post-deploy health gate -> auto-rollback
HCODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://localhost:3100/api/health)"
if [ "$HCODE" != "200" ]; then
  slog error deploy "Post-deploy health FAILED ($HCODE) — auto-rolling back"
  echo "HEALTH FAILED ($HCODE) — rolling back to $LAST_GOOD"
  bash "$DIR/rollback.sh" "$LAST_GOOD"; exit 1
fi

# 6) Smoke gate -> auto-rollback
if ! bash "$DIR/smoke-test.sh"; then
  slog error deploy "Smoke gate FAILED — auto-rolling back"
  echo "SMOKE FAILED — rolling back to $LAST_GOOD"
  bash "$DIR/rollback.sh" "$LAST_GOOD"; exit 1
fi

# 7) Success — record new known-good ref
echo "$NEW_REF" > .last-good-ref
slog info deploy "Deploy SUCCESS: $NEW_REF is now the known-good build"
echo "DEPLOY OK — $NEW_REF (last-good updated)"
