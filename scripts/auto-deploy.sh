#!/usr/bin/env bash
# Xentral auto-deploy watcher. Polls origin/main; on a new commit it pulls,
# installs, builds and pm2-reloads. If the build fails, the previous build
# stays live (no broken deploy). No secrets needed: the repo deploy key on
# this server gives read access. Run every minute via cron (flock-guarded).
export PATH=/usr/local/bin:/usr/bin:/bin
LOG=/var/log/xentral-deploy.log
cd /var/www/xentral || exit 0

git fetch origin main --quiet 2>>"$LOG"
LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
[ -z "$REMOTE" ] && exit 0
[ "$LOCAL" = "$REMOTE" ] && exit 0

{
  echo "----- $(date '+%F %T') new commit $REMOTE — deploying"
  git pull --ff-only
  pnpm install
  if pnpm -C apps/web build; then
    pm2 reload xentral-next --update-env
    echo "$(date '+%F %T') DEPLOYED OK $REMOTE"
  else
    echo "$(date '+%F %T') BUILD FAILED — kept previous build"
  fi
} >> "$LOG" 2>&1
