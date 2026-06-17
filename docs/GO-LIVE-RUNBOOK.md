# Xentral Go-Live Runbook

Cutover of the new modular build (`/var/www/xentral`, served at `next.xentral.ae`)
to become the production app at `app.xentral.ae`. The old monolith
(`/var/www/leadhero`) stays in place untouched as the rollback target.

**Principle:** everything is already built and shipped *dormant*. Going live is
flipping environment flags, validating, then redirecting one nginx server block.
Every step is reversible.

---

## 0. Pre-flight (no change to production)

- [ ] New build is healthy on `https://next.xentral.ae` (login page + seed pages return 200).
- [ ] You have the production `DATABASE_URL` (same DB the old app uses).
- [ ] You have generated a strong session secret, e.g. `openssl rand -hex 32`.
- [ ] Confirm the old app still serves `https://app.xentral.ae`.

> Secrets are set directly on the server. Never paste them into chat.

---

## 1. Arm the new build (still on next.xentral.ae)

Edit the new app's environment (e.g. `/var/www/xentral/apps/web/.env` or the pm2
ecosystem env), adding:

```
XENTRAL_LIVE_DATA=1
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/leadhero_db
XENTRAL_SESSION_SECRET=<output of: openssl rand -hex 32>
```

Then restart and reload env:

```
pm2 restart xentral-next --update-env
```

What this turns on, all at once:
- the Postgres `DataSource` (real data through the DataPort),
- the `SessionPort` resolver (reads the signed `xentral_session` cookie),
- the auth middleware (unauthenticated app routes → `/auth/login`),
- `POST /api/auth/login` (was 503 → now authenticates).

---

## 2. Make the existing login mint the cookie

The new build reads an HMAC-signed cookie named `xentral_session`:

```
base64url(JSON.stringify({ userId, companyId, role })) + "." +
base64url(HMAC_SHA256(payload, XENTRAL_SESSION_SECRET))
```

Two options:

- **A (simplest):** let the new build's own `/api/auth/login` be the login. The
  `/auth/login` page already posts to it; it verifies email + bcrypt password
  against the `users` table and sets the cookie. Nothing else needed.
- **B (keep old login):** have the existing leadhero login *also* set this cookie
  using the same secret and `signSession()` payload shape. Use this only if you
  want both apps logged in during a transition.

For a clean cutover, **A** is recommended.

---

## 3. Validate on next.xentral.ae (before touching app.xentral.ae)

- [ ] Visit `https://next.xentral.ae/dashboard` logged out → redirected to `/auth/login`.
- [ ] Sign in with a real account → lands on `/dashboard`, sees **that tenant's** data.
- [ ] Spot-check a few modules (Contacts, Invoices, Deals) show real rows, scoped to the company.
- [ ] Log in as a second company's user → confirm no cross-tenant leakage.
- [ ] `GET /api/auth/logout` clears the session and returns to the login page.

If anything is off, unset `XENTRAL_LIVE_DATA` and `pm2 restart xentral-next
--update-env` → instantly back to safe seed. No data was written (reads only).

---

## 4. nginx cutover (the one reversible line)

Back up the current config first:

```
cp /etc/nginx/sites-available/app.xentral.ae /etc/nginx/sites-available/app.xentral.ae.bak.$(date +%F)
```

In the `server { server_name app.xentral.ae; }` block, point the upstream
`proxy_pass` from the old app's port to the new build's port (the port
`xentral-next` listens on, e.g. `pm2 describe xentral-next`).

```
# was:  proxy_pass http://127.0.0.1:<OLD_LEADHERO_PORT>;
proxy_pass http://127.0.0.1:<XENTRAL_NEXT_PORT>;
```

Test and reload:

```
nginx -t && systemctl reload nginx
```

`app.xentral.ae` now serves the new build. `next.xentral.ae` can keep pointing at
the same build (or be retired later).

---

## 5. Post-cutover checks

- [ ] `https://app.xentral.ae/auth/login` loads, sign-in works.
- [ ] Real data renders, tenant-scoped.
- [ ] Existing users can log in with their current passwords (bcrypt unchanged).

---

## Rollback (any time, ~30 seconds)

1. Restore the nginx upstream to the old port:
   ```
   cp /etc/nginx/sites-available/app.xentral.ae.bak.<date> /etc/nginx/sites-available/app.xentral.ae
   nginx -t && systemctl reload nginx
   ```
2. `app.xentral.ae` is served by the old `/var/www/leadhero` monolith again.

The old app was never modified or stopped, so rollback is just the reverse
nginx flip. Optionally also `XENTRAL_LIVE_DATA=0` on the new build to return it
to dormant/seed.

---

## Notes

- The new build only ever **reads** the database (tenant-scoped, quoted camelCase
  columns matching the existing Prisma schema). No migrations, no writes during
  cutover.
- `/var/www/leadhero` is the reference template and rollback — do not delete it.
- Forged/unsigned cookies resolve to no tenant (→ seed), never another tenant.
