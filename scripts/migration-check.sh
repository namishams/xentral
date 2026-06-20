#!/usr/bin/env bash
# Migration safety — blocks destructive SQL (DROP/TRUNCATE/DELETE/destructive
# ALTER) from deploying unless MIGRATION_APPROVED=1 is explicitly set.
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "$DIR/_safety.sh"
cd "$SAFETY_ROOT"

# Collect SQL to scan: explicit path arg, else SQL changed since last good ref.
files=""
if [ "${1:-}" != "" ]; then files="$(find "$1" -name '*.sql' 2>/dev/null)"
else
  base="$(cat .last-good-ref 2>/dev/null || echo '')"
  if [ -n "$base" ]; then files="$(git diff --name-only "$base"..HEAD -- '*.sql' 2>/dev/null)"; fi
fi

if [ -z "$files" ]; then echo "MIGRATION: no SQL changes to check"; slog info deploy "Migration check: no SQL changes"; exit 0; fi

PATTERN='DROP[[:space:]]+(TABLE|COLUMN|DATABASE|SCHEMA|INDEX|CONSTRAINT|TYPE)|TRUNCATE[[:space:]]|DELETE[[:space:]]+FROM|ALTER[[:space:]]+TABLE.*DROP'
hits=0
for f in $files; do
  [ -f "$f" ] || continue
  if grep -niE "$PATTERN" "$f" >/dev/null 2>&1; then
    echo "  DESTRUCTIVE SQL in $f:"; grep -niE "$PATTERN" "$f" | sed 's/^/    /'
    slog error deploy "Destructive migration detected in $f"; hits=1
  fi
done

if [ "$hits" = "1" ] && [ "${MIGRATION_APPROVED:-0}" != "1" ]; then
  echo "MIGRATION: BLOCKED — destructive changes require MIGRATION_APPROVED=1 (manual approval)."
  slog error deploy "Migration check BLOCKED deploy (no approval)"; exit 1
fi
[ "$hits" = "1" ] && echo "MIGRATION: destructive changes APPROVED (MIGRATION_APPROVED=1)" && slog warn deploy "Destructive migration manually approved"
echo "MIGRATION: PASS"; exit 0
