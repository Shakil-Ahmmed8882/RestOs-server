# Production Deployment Fix — Vercel 404 + Wrong Redirect URLs

Three independent bugs were causing the production failure. Two are fixed in code (this commit); one is a Vercel dashboard change you must do manually.

---

## Bug 1 — Every API route returned 404 in production (FIXED in code)

**Symptom:** `https://rest-os-server-lyart.vercel.app/anything` → `404: NOT_FOUND` from Vercel's edge, not from Express.

**Root cause:** `vercel.json` pointed the builder at `dist/server.js`, but `dist/` does not exist in the git repo (it's in `.gitignore`). Vercel's `buildCommand` runs *after* the build config is resolved, so the builder couldn't find an entry point and shipped a deployment with no function attached. Every URL hit the Vercel 404 page.

**Fix:** point the builder at the TypeScript source. `@vercel/node` compiles it during the build:

```json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }]
}
```

After this commit lands and Vercel rebuilds, every route under `/api/v1/...` will work again.

---

## Bug 2 — SSLCommerz called `…/api/v1/api/v1/payments/success` → 404 (FIXED in code)

**Symptom:** Even after Bug 1 is fixed, SSLCommerz callbacks would have hit a doubled prefix and 404'd.

**Root cause:** the production `SERVER_URL` env var was set to `https://rest-os-server-lyart.vercel.app/api/v1` (already includes the prefix), but `payment.service.ts` appended `/api/v1/payments/success` again, producing `…/api/v1/api/v1/payments/success`.

**Fix:** the service now normalizes `SERVER_URL` — strips trailing slash, only appends `/api/v1` if it's not already there. Both forms now work:
- `SERVER_URL=https://rest-os-server-lyart.vercel.app` ✓
- `SERVER_URL=https://rest-os-server-lyart.vercel.app/api/v1` ✓

---

## Bug 3 — Success/Fail pages redirected to `localhost:3000` in production (FIXED in code)

**Symptom:** Even when SSLCommerz called back successfully, the user was sent to `http://localhost:3000/payments/success` — which is the dev URL, useless in production. The browser shows a connection-refused page or a Vercel 404 if the URL got rewritten.

**Root cause:** `payment.controller.ts` had `localhost:3000` hardcoded in `handlePaymentSuccess`, `handlePaymentFail`, and `handlePaymentCancel` (a leftover debug change, marked with `// HARDCODED for debugging`).

**Fix:** controllers now use the `buildRedirect()` helper that already existed in the file. It reads `CLIENT_SUCCESS_URL` / `CLIENT_FAILED_URL` / `CLIENT_CANCELLED_URL` from env, falling back to `CLIENT_URL + path`, falling back to localhost only in dev.

---

## What YOU still have to do — set env vars in Vercel dashboard

Your local `.env` file is **not** deployed to Vercel. Vercel reads env vars from its own dashboard. Go to:

> **Vercel Dashboard → rest-os-server → Settings → Environment Variables**

Set every one of these for the **Production** environment (and Preview, if you want preview URLs to work too):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `mongodb+srv://RestaurantManagementSystem:VvORLvvbBbIXOxvo@cluster0.sk8jxpx.mongodb.net/RestOS?retryWrites=true&w=majority` |
| `NODE_ENV` | `production` |
| `JWT_ACCESS_SECRET` | (copy from your `.env`) |
| `JWT_REFRESH_SECRET` | (copy from your `.env`) |
| `JWT_ACCESS_EXPIRES_IN` | `5d` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `BCRYPT_SALT_ROUND` | `10` |
| `STORE_ID` | `testbox` (or your real SSLCommerz store id) |
| `STORE_PASSWD` | `qwerty` (or your real SSLCommerz password) |
| `IS_LIVE` | `false` |
| `SERVER_URL` | `https://rest-os-server-lyart.vercel.app` *(NO `/api/v1` suffix — the code adds it. Either form works after the fix, but cleaner without.)* |
| `CLIENT_URL` | `https://rest-os-client.vercel.app` |
| `CLIENT_SUCCESS_URL` | `https://rest-os-client.vercel.app/payments/success` |
| `CLIENT_FAILED_URL` | `https://rest-os-client.vercel.app/payments/error?variant=failed` |
| `CLIENT_CANCELLED_URL` | `https://rest-os-client.vercel.app/payments/error?variant=cancelled` |
| `RESET_PASS_UI_LINK` | `https://rest-os-client.vercel.app/reset-password` |
| `CLOUDINARY_CLOUD_NAME` | (copy) |
| `CLOUDINARY_API_KEY` | (copy) |
| `CLOUDINARY_API_SECRET` | (copy) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (copy) |
| `SMTP_PASS` | (copy) |
| `FREE_CONTENT_ACCESS_SECRET` | (copy) |

**After setting them: Vercel does NOT auto-redeploy on env var changes.** You must trigger a redeploy:
- Dashboard → Deployments → click the latest → "⋯" menu → **Redeploy**.
- Or push a new commit (this one will do it).

---

## How to verify production is fixed

After Vercel rebuilds (~2 min after this commit lands):

```bash
# 1. Root should respond (not 404)
curl -i https://rest-os-server-lyart.vercel.app/
# Expect: 200 "Restaurant Operating System Server!"

# 2. An API route should respond
curl -i https://rest-os-server-lyart.vercel.app/api/v1/foods
# Expect: 200 with JSON

# 3. Payment success endpoint should respond (not 404)
curl -i "https://rest-os-server-lyart.vercel.app/api/v1/payments/success?tran_id=test"
# Expect: 200 HTML page that redirects to rest-os-client.vercel.app/payments/success
```

Then run a real checkout: cart → place order → pay with SSLCommerz sandbox card `4111 1111 1111 1111`. After paying, the browser should land on `https://rest-os-client.vercel.app/payments/success?transactionId=TXN-...`.

---

## Why local `.env` doesn't deploy

`.env` is in `.gitignore` (correctly — it has secrets). Git never sends it to GitHub, so Vercel never sees it. Vercel has its own env var store in the dashboard. Whenever you add/change an env var:
1. Add it to local `.env` (for dev).
2. Add it to Vercel dashboard (for prod).
3. Redeploy.

Easy to forget step 2 — that's why prod was missing every env var.
