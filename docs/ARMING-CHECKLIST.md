# Step 1 — Arm next.xentral.ae with real data (validation before cutover)

This makes **next.xentral.ae** run on real data behind login, so we can verify
everything works. **app.xentral.ae stays 100% untouched** (still the old app).
Fully reversible. No secrets are typed by hand — the helper copies them from the
existing app's `.env` and generates the session secret on the server.

---

## A. Arm it (one block, run on the server as root)

```bash
cd /var/www/xentral/apps/web
OLD=/var/www/leadhero/.env
# carry over the values the new build needs (read straight from the old app)
{
  echo "XENTRAL_LIVE_DATA=1"
  echo "XENTRAL_SESSION_SECRET=$(openssl rand -hex 32)"
  grep -E '^(DATABASE_URL|SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|SMTP_FROM|WHATSAPP_APP_SECRET|OPENAI_API_KEY)=' "$OLD"
} > .env.local
chmod 600 .env.local
pm2 restart xentral-next --update-env
```

What this turns on, all behind the flag:
- real DB reads (CRM, Marketplace listings) — tenant-scoped,
- login via the existing users + bcrypt passwords,
- the auth middleware (app routes require sign-in),
- the Mediflow buy transaction, the e-mail function, the WhatsApp webhook + send.

To **disarm** at any time (back to safe seed, instant):
```bash
rm /var/www/xentral/apps/web/.env.local && pm2 restart xentral-next --update-env
```

---

## B. Verify together (after arming)

Tell me once it's armed and I'll run these checks with you. What we confirm:

1. **Login** — `https://next.xentral.ae/auth/login`, sign in with a real account →
   lands on the dashboard. (Endpoint check: `POST /api/auth/login` returns 200, not 503.)
2. **Tenant isolation** — the dashboard / Contacts / Companies show **that company's**
   real data only. Log in as a second company → no cross-tenant leakage.
3. **Marketplace** — `/marketplace` shows the **real** Mediflow listings (masked),
   with the live dutch-auction price.
4. **Buy (one controlled test)** — purchase one cheap lead → credits decrement by
   the price, the contact unlocks, a row appears in `marketplace_purchases` +
   `credit_transactions`, and (if SMTP works) a confirmation e-mail arrives.
5. **WhatsApp receive** — send a message to your number → it appears as an inbound
   message (webhook stored it). Point Meta's webhook URL at
   `https://next.xentral.ae/api/whatsapp/webhook` for the test, or test after cutover.
6. **WhatsApp send** — reply from the inbox → arrives on the phone.
7. **E-mail** — trigger any send (e.g. the purchase confirmation) → it's delivered.

I'll give you the exact curl/SQL spot-checks for each as we go, and read the
results with you (no PII printed).

---

## C. Only after every check is green → cutover (Step 2)

Split the nginx `app.xentral.ae` server block to point at the new build's port
(`127.0.0.1:3100`), keeping `xentral.ae` on the old app for marketing. One
reversible line; old app stays as instant rollback. Full detail in
`docs/GO-LIVE-RUNBOOK.md`.

> Known gradual-after items (you already approved these as "nach und nach"):
> WhatsApp AI auto-reply / intake agent, calendar, automations, the rest of the
> AI features. They come over module by module after cutover; nothing live breaks
> because the webhook still captures every inbound message in the meantime.
