# Frontend Checkout — "Continue to Payment" Redirect Fix

> Paste this into the Next.js frontend assistant. It is a focused brief for the **one bug the user is hitting right now**: after clicking *Continue to Payment*, the UI shows "Placing orders…" and then nothing happens — the modal stays open and the browser never leaves for SSLCommerz.
>
> The backend is fine. `POST /payments/initiate` returns a valid `paymentUrl`. The redirect is dying on the frontend.

---

## 1. What the user is supposed to see

The full happy path, from the user's point of view:

1. User is on the **Cart** page with items in it.
2. Clicks **Checkout**.
3. A **pre-payment modal** opens — this is the "quick heads up" screen.
   - Title: *"You're about to be redirected to SSLCommerz"*
   - Body explains: SSLCommerz is Bangladesh's payment gateway; they'll see options for **bKash, Nagad, Rocket, Cards, Internet Banking**; the page will look different from our site — that's normal.
   - Shows the order summary (items + total in BDT).
   - Two buttons: **Cancel** (closes modal) and **Continue to Payment** (primary).
4. User clicks **Continue to Payment**.
5. Button shows inline status — short, sequential, one line:
   - `Placing your order…` (while `POST /orders/create-order` runs, ~500ms)
   - `Opening secure payment…` (while `POST /payments/initiate` runs, ~1s)
   - `Redirecting to SSLCommerz…` (right before `window.location.href = paymentUrl`)
6. The browser **fully leaves** the app and loads the SSLCommerz gateway page.
7. After payment, SSLCommerz → backend → `302` back to `/payments/success` (or `/payments/error?variant=failed|cancelled`).

What the user is seeing today: step 5 stops at "Placing orders…" and step 6 never happens. The modal stays open. There is no error, no toast, nothing.

---

## 2. Why the redirect is dying (diagnose first, then fix)

There are exactly **four** reasons a `window.location.href = url` doesn't fire in this flow. Check them in this order — do not skip ahead.

### 2.1 The `initiatePayment` call is throwing and being silently swallowed

The most common cause. Pattern that breaks:

```ts
// BROKEN — error is caught by react-query, the orchestrator never reaches step 4
const onClick = async () => {
  setStatus("Placing order…");
  const orders = await createOrder.mutateAsync(payload);
  setStatus("Opening payment…");
  const { paymentUrl } = await initiatePay.mutateAsync({ orderIds }); // throws
  window.location.href = paymentUrl; // never runs
};
```

If `initiatePayment` 401s (missing/expired token), 400s ("Order not found or unauthorized"), or returns `{ success: false }`, **the await throws**, and if the `onClick` has no `try/catch`, the error gets eaten by the framework and the UI is just… stuck on "Placing orders…".

**Fix:** wrap the whole orchestrator in `try / catch / finally` and **always** reset the status text and show the error:

```ts
const onClick = async () => {
  setStatus("Placing your order…");
  try {
    const orders = await createOrder.mutateAsync(payload);
    if (!orders?.length) throw new Error("No items could be ordered. They may be out of stock.");

    const orderIds = orders.map(o => o._id);
    sessionStorage.setItem("pendingOrderIds", JSON.stringify(orderIds));

    setStatus("Opening secure payment…");
    const res = await initiatePay.mutateAsync({ orderIds });

    if (!res?.paymentUrl) throw new Error("Payment gateway did not return a URL. Try again.");

    sessionStorage.setItem("pendingTxnId", res.transactionId);
    setStatus("Redirecting to SSLCommerz…");

    // Give React one tick to paint the final status, then leave.
    setTimeout(() => { window.location.href = res.paymentUrl; }, 50);
  } catch (err: any) {
    setStatus(null);
    toast.error(err?.message ?? "Could not start payment. Please try again.");
  }
};
```

Three things this fixes at once:
- The user **sees** the failure instead of staring at a stuck modal.
- The status string resets so the button is clickable again.
- The `setTimeout(0)` lets the final "Redirecting…" frame paint before the navigation tears down the page.

### 2.2 The fetch is using `response.json()` on a non-JSON / empty body

If your `api()` client does `await res.json()` unconditionally and the backend responds with `204` or HTML (e.g. CORS preflight failed and you got an HTML error page), the JSON parse throws **before** you ever look at `res.ok`. The await rejects, but if it rejects with a `SyntaxError: Unexpected token <`, that doesn't look like a normal API error and is easy to miss.

**Fix:** guard the parse:

```ts
const text = await res.text();
const json = text ? JSON.parse(text) : {};
if (!res.ok || json.success === false) throw new Error(json.message ?? `HTTP ${res.status}`);
return json;
```

### 2.3 `paymentUrl` is empty string / undefined and `window.location.href = ""` is a no-op

If the backend `.env` is missing `STORE_ID` / `STORE_PASSWD`, the SSLCommerz SDK returns `{ failedreason: "..." }` and the controller still responds `200` with `paymentUrl: ""`. Setting `window.location.href = ""` does nothing — no error, no navigation. **This is exactly the "nothing happens" symptom the user described.**

**Fix:** the guard `if (!res?.paymentUrl) throw new Error(...)` from §2.1 catches this. Then check the backend `.env`:

```
STORE_ID=...
STORE_PASSWD=...
IS_LIVE=false
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

### 2.4 The modal is intercepting the navigation

If the **Continue to Payment** button is inside a `<form>` without `type="button"`, the click triggers a form submit, which re-renders the modal and aborts the in-flight async work. Or if the modal library (Radix Dialog, HeadlessUI Dialog, MUI) re-mounts the page on close and you've wired `setStatus` to a state inside the modal, the state vanishes mid-flight.

**Fix:**
- Every button inside the modal: `<button type="button" onClick={...}>`.
- Keep the checkout state in a **page-level** hook (`usePlaceOrderAndPay`), not in modal-local state. The modal only reads/displays status; it does not own it.
- Do **not** close the modal until either (a) `window.location.href` has fired, or (b) the catch block runs.

---

## 3. The pre-payment modal — copy & structure

This is the "quick heads up" screen the user asked for. Build it as a controlled dialog. Suggested copy:

```
┌───────────────────────────────────────────────────────┐
│  Redirecting to SSLCommerz                            │
│                                                       │
│  You'll be taken to SSLCommerz — Bangladesh's secure  │
│  payment gateway — to complete your purchase. You can │
│  pay with:                                            │
│                                                       │
│   • bKash, Nagad, Rocket, Upay (mobile banking)       │
│   • Visa / Mastercard / Amex                          │
│   • Internet banking (any major BD bank)              │
│                                                       │
│  The page will look different from RestOs — that's    │
│  normal. After payment you'll come right back here.   │
│                                                       │
│  ─────────────────────────────────────────────────    │
│  Order summary                                        │
│   Chicken Biryani × 2     ৳ 700                       │
│   Beef Tehari × 1         ৳ 400                       │
│  ─────────────────────────────────────────────────    │
│   Total                   ৳ 1,100                     │
│                                                       │
│            [ Cancel ]   [ Continue to Payment ]       │
│                                                       │
│   <status line appears here while processing>         │
└───────────────────────────────────────────────────────┘
```

Rules for the modal:
1. **Cancel** must always work, even during processing — wire it to abort: `setStatus(null); abortController.abort(); onClose();`. If the order has already been placed, leave it pending (the user can pay from the *Pending Orders* page later) — do **not** try to delete it.
2. **Continue to Payment** is `disabled` while `status !== null`, so the user can't double-click and create duplicate orders.
3. The status line is `<p role="status" aria-live="polite">` so screen readers announce each transition.
4. Do **not** show a spinner without text. "Loading…" with no context is the same UX bug the user is complaining about.

---

## 4. The fix checklist — give this to the frontend

In priority order. The bug almost certainly goes away after items 1–3.

- [ ] **Wrap the checkout `onClick` in `try / catch / finally`.** Any thrown error must reset the status string and surface a toast. Do not let it die silently. (§2.1)
- [ ] **Guard `paymentUrl` before navigating.** `if (!res?.paymentUrl) throw new Error("Gateway URL missing")`. (§2.3)
- [ ] **Use `setTimeout(() => location.href = url, 50)`** so the final status paints before the page tears down. (§2.1)
- [ ] **Open the browser devtools Network tab and click Continue to Payment.** Confirm:
  - `POST /api/v1/orders/create-order` returns 200 with a non-empty `data` array.
  - `POST /api/v1/payments/initiate` returns 200 with a non-empty `data.paymentUrl` starting with `https://sandbox.sslcommerz.com/...`.
  - If either is missing, the bug is **not** the redirect — it's the call before it. Read the response body and surface the message.
- [ ] **Confirm the backend `.env` has `STORE_ID` / `STORE_PASSWD` / `CLIENT_URL=http://localhost:3000`.** A blank `paymentUrl` means missing credentials. (§2.3)
- [ ] **Every modal button is `type="button"`.** (§2.4)
- [ ] **Checkout state lives in a page-level hook (`usePlaceOrderAndPay`), not modal-local state.** The modal reads status, never owns it. (§2.4)
- [ ] **Build the pre-payment modal** with the copy from §3 — explicit list of payment methods, "page will look different" reassurance, order summary, two buttons.
- [ ] **Build `/payments/success` and `/payments/error?variant=failed|cancelled`** per §4.1 and §4.2 of `order_payment_frontend_flow.md`. The success page must `clear()` the cart and invalidate `["payments","history"]`, `["orders","list"]`, `["orders","summary",userId]`. The error page must **not** clear the cart.
- [ ] **`window.location.href = paymentUrl`** — never `router.push`, never `<a>` click, never `<iframe>`. A full-page navigation is required because SSLCommerz needs to own the URL bar to redirect back.

---

## 5. One-line summary for the frontend agent

> The checkout modal is stuck because `await initiatePay.mutateAsync(...)` is either throwing into a missing catch block or resolving with an empty `paymentUrl`. Wrap the orchestrator in try/catch, guard `paymentUrl` before navigating, do `window.location.href = paymentUrl` with a 50ms timeout, and surface every failure as a toast instead of leaving the user staring at "Placing orders…".
