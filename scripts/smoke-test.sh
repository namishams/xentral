#!/usr/bin/env bash
# Smoke gate — every critical route must be alive and /api/health must not be
# unhealthy. ANY failure exits non-zero so the deploy is aborted.
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "$DIR/_safety.sh"
BASE="${BASE_URL:-http://localhost:3100}"

# route:expectation  — 200 = must be exactly 200; alive = <500 and not 404
ROUTES=( "/auth/login:200" "/:200" "/dashboard:alive" "/contacts:alive" "/companies:alive" "/leads:alive" "/deals:alive" )
fail=0

for entry in "${ROUTES[@]}"; do
  path="${entry%%:*}"; expect="${entry##*:}"
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BASE$path")"
  ok=0
  if [ "$expect" = "200" ]; then [ "$code" = "200" ] && ok=1
  else [ "$code" -lt 500 ] 2>/dev/null && [ "$code" != "404" ] && ok=1; fi
  if [ "$ok" = "1" ]; then printf "  ok   %-16s %s\n" "$path" "$code"
  else printf "  FAIL %-16s %s\n" "$path" "$code"; slog error smoke "Smoke route failed: $path -> $code"; fail=1; fi
done

# health must be 200 and status != unhealthy
hbody="$(curl -s --max-time 15 "$BASE/api/health")"
hcode="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BASE/api/health")"
hstatus="$(echo "$hbody" | grep -oE '"status":"[a-z]+"' | head -1 | cut -d'"' -f4)"
if [ "$hcode" = "200" ] && [ "$hstatus" != "unhealthy" ]; then printf "  ok   %-16s %s (%s)\n" "/api/health" "$hcode" "$hstatus"
else printf "  FAIL %-16s %s (%s)\n" "/api/health" "$hcode" "${hstatus:-none}"; slog error smoke "Health gate failed: $hcode $hstatus"; fail=1; fi

if [ "$fail" = "0" ]; then slog info smoke "Smoke gate PASSED"; echo "SMOKE: PASS"; exit 0
else slog error smoke "Smoke gate FAILED"; echo "SMOKE: FAIL"; exit 1; fi
