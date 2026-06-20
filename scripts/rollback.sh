#!/usr/bin/env bash
# Rollback to a known-good git ref: checkout, rebuild, restart, re-health.
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "$DIR/_safety.sh"
cd "$SAFETY_ROOT"
REF="${1:-$(cat .last-good-ref 2>/dev/null || echo '')}"
if [ -z "$REF" ]; then slog error rollback "No rollback ref available"; echo "ROLLBACK: no ref"; exit 1; fi
slog warn rollback "Rolling back to $REF"
echo "ROLLBACK -> $REF"
git checkout -f "$REF" >/dev/null 2>&1 || { slog error rollback "git checkout $REF failed"; exit 1; }
pnpm -w build >/tmp/rollback-build.log 2>&1 || { slog error rollback "Rollback build failed"; exit 1; }
export XENTRAL_BUILD_REF="$(git rev-parse --short HEAD)"
pm2 restart xentral-next --update-env >/dev/null 2>&1
sleep 4
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://localhost:3100/api/health)"
if [ "$code" = "200" ]; then slog info rollback "Rollback to $REF healthy"; echo "ROLLBACK: OK ($REF)"; exit 0
else slog error rollback "Rollback to $REF still unhealthy ($code)"; echo "ROLLBACK: health $code"; exit 1; fi
