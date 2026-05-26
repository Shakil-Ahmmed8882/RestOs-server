# Vercel Production Deployment — Audit & Checklist

This document captures everything that could break in production, what's been fixed, and what you must do manually in the Vercel dashboard.

---

## 1. What this commit fixes

| # | File | Bug | Severity |
|---|------|-----|----------|
| 1 | `vercel.json` | Pointed at `dist/server.js` which doesn't exist on Vercel (`dist/` is gitignored). Result: **every API route returned 404**. Now points at `src/server.ts`; `@vercel/node` compiles TS inside Vercel's build. | **HIGH** |
| 2 | `payment.controller.ts` | `success/fail/cancel` callback URLs were hardcoded to `localhost:3000`. After SSLCommerz paid, users landed on a dead URL. Now reads `CLIENT_SUCCESS_URL` / `CLIENT_FAILED_URL` / `CLIENT_CANCELLED_URL` env vars. | **HIGH** |
| 3 | `payment.service.ts` | SSLCommerz `success_url` was built as `${SERVER_URL}/api/v1/...` but the prod `SERVER_URL` already ended in `/api/v1`, producing `…/api/v1/api/v1/payments/success` (404). Now normalizes the URL — either form works. | **HIGH** |
| 4 | `auth.controller.ts` | `res.cookie("refreshToken", …)` was missing `sameSite: 'none'`. Browsers silently drop cross-subdomain cookies without it, so **the refresh-token flow would never work in production** (login appears to succeed, then the next refresh fails). Now sets `sameSite: 'none'` in prod, `lax` in dev. | **HIGH** |
| 5 | `auth.controller.ts` | Removed a `console.log("________…", refreshToken)` that printed secrets to Vercel logs. | LOW |
| 6 | `.env` | Restructured into SHARED / DEVELOPMENT / PRODUCTION blocks so you can flip between dev and prod by commenting/uncommenting one block. | — |

---

## 2. What was already done right (don't change these)

- **Mongoose connection caching** ([src/server.ts:87-134](src/server.ts#L87-L134)) — single promise, gated middleware, retry on failure. This is the correct pattern for Vercel cold starts.
- **Multer uses `memoryStorage`** ([src/app/modules/media-management/media.config.ts](src/app/modules/media-management/media.config.ts)) — required, since Vercel's filesystem is read-only except `/tmp`.
- **Cloudinary streams from memory buffer** — no disk writes.
- **Body size capped at 4MB** ([media.constants.ts:7](src/app/modules/media-management/media.constants.ts#L7)) — under Vercel's 4.5MB body limit. Already commented in commit `9a6e2b2`.
- **Request timeout middleware (25s)** ([src/server.ts:40-57](src/server.ts#L40-L57)) — protects against the Vercel 60s function timeout.
- **CORS allows the prod frontend** ([src/app.ts:32-49](src/app.ts#L32-L49)) — `https://rest-os-client.vercel.app` is in the allowlist with `credentials: true`.
- **Comment service has no transactions** (fixed in commit `ca7a88f`) — transactions on serverless cold starts can hang past the timeout.

---

## 3. Vercel dashboard — set these env vars (REQUIRED)

Vercel does **not** read your local `.env`. Go to **Vercel Dashboard → rest-os-server → Settings → Environment Variables** and add each of these for the **Production** environment:

### Shared (same as dev)

```
DATABASE_URL=mongodb+srv://RestaurantManagementSystem:VvORLvvbBbIXOxvo@cluster0.sk8jxpx.mongodb.net/RestOS?retryWrites=true&w=majority
JWT_ACCESS_SECRET=484f355624efec173c93ab196d86cd6719fe260325bb78f18574779e872350e0
JWT_REFRESH_SECRET=58c51c4b73ec542d18fe2430f757bbd67e42509a3242a444873779f8df31defb
JWT_ACCESS_EXPIRES_IN=5d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUND=10
FREE_CONTENT_ACCESS_SECRET=defaultFreeContentAccessSecret32Bit
STORE_ID=testbox
STORE_PASSWD=qwerty
IS_LIVE=false
CLOUDINARY_CLOUD_NAME=dmg3ltri6
CLOUDINARY_API_KEY=779899261334986
CLOUDINARY_API_SECRET=nPXon-ibZRRLW9Op5UQUlVlpu6I
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shakilahmmed8882@gmail.com
SMTP_PASS=djpc bqdc vhsx clsr
```

### Production-only

```
NODE_ENV=production
SERVER_URL=https://rest-os-server-lyart.vercel.app
CLIENT_URL=https://rest-os-client.vercel.app
RESET_PASS_UI_LINK=https://rest-os-client.vercel.app/reset-password
CLIENT_SUCCESS_URL=https://rest-os-client.vercel.app/payments/success
CLIENT_FAILED_URL=https://rest-os-client.vercel.app/payments/error?variant=failed
CLIENT_CANCELLED_URL=https://rest-os-client.vercel.app/payments/error?variant=cancelled
```

> **Note on `SERVER_URL`**: do NOT include `/api/v1` at the end. The code adds it. After fix #3 either form works, but cleaner without.

**After setting env vars** → Vercel does not auto-redeploy. Trigger one:
- Dashboard → Deployments → latest → ⋯ → **Redeploy**, or
- Push a commit (this one will).

---

## 4. Verifying production after redeploy

Wait ~2 minutes for the rebuild, then run:

```bash
# 1. Root responds
curl -i https://rest-os-server-lyart.vercel.app/
# Expect: 200 "Restaurant Operating System Server!"

# 2. An API route responds
curl -i https://rest-os-server-lyart.vercel.app/api/v1/foods
# Expect: 200 with JSON

# 3. Payment callback redirects to frontend (not localhost)
curl -i "https://rest-os-server-lyart.vercel.app/api/v1/payments/success?tran_id=test"
# Expect: 200 HTML containing "rest-os-client.vercel.app/payments/success"
```

Then real test: log in → cart → checkout → pay with SSLCommerz sandbox card `4111 1111 1111 1111` → should land on `https://rest-os-client.vercel.app/payments/success?transactionId=…`.

---

## 5. Things that will still be fragile (medium-risk, not blocking)

These didn't get changed in this commit because they aren't actively broken, but watch for them.

### 5.1 Transactions in other modules

`vote.service.ts`, `reply.service.ts`, `food-category.service.ts`, `order.service.ts`, `profile.service.ts` still use `session.startTransaction()`. On a cold start with a slow Atlas handshake, a transaction can stall and burn the 25s budget. The comment service was already simplified; if you see hangs in those other modules, that's the cause.

**Fix when it bites:** drop the transaction, do the writes sequentially, and add a compensating delete if a later write fails.

### 5.2 Comments / Replies / Votes — high write volume on serverless

Each request opens a connection, awaits a transaction, writes 1-3 docs, populates the result. If traffic spikes, you'll hit Atlas connection-pool ceilings (`maxPoolSize: 5` per Vercel container × many containers). Monitor connection counts in Atlas.

### 5.3 Image uploads at 4MB limit

You're at the Vercel body-size cap. A 4.2MB upload with multipart overhead can exceed 4.5MB and fail with a confusing error. If users hit this, lower the limit to 3.5MB in [media.constants.ts](src/app/modules/media-management/media.constants.ts).

### 5.4 SSLCommerz webhook signature verification

You're trusting that any POST to `/api/v1/payments/success` with a `tran_id` came from SSLCommerz. The validator API call in `verifyPayment` checks this, but on validator error you currently fall through to "mark completed anyway." This is fine for sandbox / a portfolio project; for real money, harden it.

### 5.5 No rate limiting

Anyone can hammer `/api/v1/auth/login` or `/api/v1/payments/initiate`. For a portfolio site this is fine; for production traffic add `express-rate-limit`.

---

## 6. The dev/prod toggle workflow

Your `.env` now has three blocks:

```
# SHARED               (always active)
# DEVELOPMENT          (active by default)
# PRODUCTION           (commented out by default)
```

**Working locally:** leave it as-is. `npm run dev` reads localhost URLs.

**Before pushing to Vercel:** you said you want to flip the toggle locally before each push. Two options:

**Option A — what you described:** edit `.env`, comment DEVELOPMENT, uncomment PRODUCTION, push. **Caveat:** `.env` is gitignored so the push itself sends nothing to Vercel — Vercel still reads from its dashboard. The local toggle only matters if *you* are running against prod URLs locally for debugging.

**Option B — what actually controls Vercel:** the env vars in Vercel's dashboard (section 3 above). Set them once, never touch `.env` for deploys.

I recommend **B** — set them in Vercel once, forget. Your `.env` is purely local. The toggle in your `.env` is useful if you ever want to point your local dev server at prod URLs to debug.
