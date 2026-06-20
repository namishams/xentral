#!/usr/bin/env bash
# Shared safety logging — appends JSON lines to logs/safety.log and stdout.
SAFETY_ROOT="${SAFETY_ROOT:-/var/www/xentral}"
SAFETY_LOG="${SAFETY_ROOT}/logs/safety.log"
mkdir -p "${SAFETY_ROOT}/logs" 2>/dev/null || true
slog() {  # slog <level> <type> <message...>
  local level="$1"; local type="$2"; shift 2; local msg="$*"
  local ts; ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local line="{\"ts\":\"$ts\",\"type\":\"$type\",\"level\":\"$level\",\"message\":\"${msg//\"/\\\"}\",\"source\":\"deploy-guard\"}"
  echo "$line" >> "$SAFETY_LOG" 2>/dev/null || true
  echo "[safety] $line"
}
