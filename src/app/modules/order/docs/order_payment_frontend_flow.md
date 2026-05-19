# Order → Payment → Purchased List — Frontend Integration Guide

> Paste this whole file into your Next.js frontend project's AI assistant. It is a complete, self-contained brief that maps the **cart → order → SSLCommerz payment → purchased list → clear cart** user flow to the real backend endpoints already implemented in `RestOs-server`.
>
> **Frontend:** `http://localhost:3000`
> **Backend:** `http://localhost:5000`  → all endpoints prefixed with `/api/v1`

---

## 0. The user journey (single source of truth)

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1 — Browse foods           GET  /foods                  │
│ Step 2 — Add to cart            (client-only state)          │
│ Step 3 — Place order            POST /orders/create-order    │
│         → backend creates N order docs (status: "pending",   │
│           paymentStatus: "pending"), deducts food.quantity   │
│ Step 4 — Initiate payment       POST /payments/initiate      │
│         → backend creates Payment doc + SSLCommerz session,  │
│           returns GatewayPageURL                             │
│ Step 5 — Redirect to SSLCommerz (gateway URL from step 4)    │
│ Step 6 — User pays via bKash / Nagad / card                  │
│ Step 7 — SSLCommerz hits backend success/fail/cancel         │
│         → backend verifies, sets payment.status="completed", │
│           order.status="confirmed", then 302 → frontend      │
│ Step 8 — Frontend success page reads ?transactionId=…        │
│         → calls GET /payments/history to refresh list        │
│         → clears local cart                                  │
│ Step 9 — Purchased list page    GET  /payments/history       │
│         (or /orders/summary/:userId for totals)              │
└──────────────────────────────────────────────────────────────┘
```

The cart is **not** a server resource. It lives entirely in client state (Zustand / Redux / Context). Only when the user clicks **Place Order** does it get turned into real Order documents.

---

## 1. Endpoints in order of use (the API contract)

> Base URL: `http://localhost:5000/api/v1`
> All authed endpoints require `Authorization: Bearer <accessToken>` **and** the request is made with `credentials: "include"` because the backend also sets cookies. The CORS config already allows `http://localhost:3000`.

### 1.1 Place the order — `POST /orders/create-order`

Auth: **not enforced by middleware** today, but you should pass the bearer token anyway so the user ID matches.

Request body — **note the `cartItems` wrapper, this is required**:

```json
{
  "cartItems": [
    {
      "food":       "66f2a1b3c4d5e6f7a8b9c0d1",   // Food _id
      "user":       "66e1f2a3b4c5d6e7f8a9b0c1",   // logged-in user _id
      "foodName":   "Chicken Biryani",
      "quantity":   2,
      "price":      350,
      "totalPrice": 700                            // price * quantity
    },
    {
      "food":       "66f2a1b3c4d5e6f7a8b9c0d2",
      "user":       "66e1f2a3b4c5d6e7f8a9b0c1",
      "foodName":   "Beef Tehari",
      "quantity":   1,
      "price":      400,
      "totalPrice": 400
    }
  ]
}
```

Response (200):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Order is create successfully",
  "data": [
    [ { "_id": "66f3...", "food": "...", "user": "...", "status": "pending",
        "paymentStatus": "pending", "totalPrice": 700, ... } ],
    [ { "_id": "66f3...", ... "totalPrice": 400, ... } ]
  ]
}
```

**Gotchas — read carefully, the backend has quirks:**

1. **One order document is created per cart item.** Two items in the cart → two `Order` docs come back. Keep all returned `_id`s — you will need them.
2. **Duplicate guard:** if the same `(food, user)` pair already has *any* order in the DB, that line item is silently skipped (no error, just missing from the response). For testing, vary the food or clean the collection.
3. **Stock guard:** if `food.quantity < cartItem.quantity` the line item is silently skipped too. Compare what you sent vs what came back, and surface "X items unavailable" if the counts differ.
4. The whole call is wrapped in a Mongo transaction, so if *any* step throws you get an HTTP 500 and **nothing** is persisted.

### 1.2 Initiate payment — `POST /payments/initiate`

Auth: **required** (`USER_ROLE.USER`). Send `Authorization: Bearer <token>`.

**Payment is per-order, not per-cart.** If the user placed an order containing 2 items → 2 Order docs → you must decide:

- **Recommended for v1:** call `POST /orders/create-order` once with the whole cart, then pick **one orderId** (e.g. the first returned) and pay for it. Loop the rest, or aggregate them server-side later. The simplest UX is to pay each order separately and show a step indicator.
- A future server change can merge cart items into a single parent `Order` — note that as a TODO and don't try to patch around it in the frontend.

Request body:

```json
{ "orderId": "66f3a1b2c3d4e5f6a7b8c9d0" }
```

Response (200):

```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "success": true,
    "paymentUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q3...",
    "transactionId": "TXN-66f3a1b2c3d4e5f6a7b8c9d0-9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "sessionkey": "....."
  }
}
```

**What to do with the response:**
1. Persist `transactionId` in client state (or `sessionStorage`) keyed by order — you will match it on the success page.
2. `window.location.href = data.paymentUrl` — full-page redirect, **not** an iframe and **not** `fetch`. SSLCommerz needs to own the URL bar so it can redirect back.

### 1.3 SSLCommerz callbacks (you do **not** call these — SSLCommerz does)

These run server-side. You only need to know **where the gateway sends the user back to** once it's done:

| Outcome | Backend route (SSLCommerz → server) | Server redirects browser to |
| --- | --- | --- |
| Success | `GET /api/v1/payments/success?tran_id=…&val_id=…&status=VALID` | `${CLIENT_URL}/payment-success?transactionId=<tran_id>` |
| Fail    | `GET /api/v1/payments/fail?tran_id=…`    | `${CLIENT_URL}/payment-failed?transactionId=<tran_id>` |
| Cancel  | `GET /api/v1/payments/cancel?tran_id=…`  | `${CLIENT_URL}/payment-cancelled?transactionId=<tran_id>` |

On `success`, the backend has already:
- verified with SSLCommerz validator API,
- set `payment.status = "completed"`,
- set `order.status = "confirmed"`.

So the success page on the frontend is **purely cosmetic + cache invalidation**. Do not "confirm" the payment again from the client.

You **must** create three pages on the frontend:

- `/payment-success` — read `?transactionId`, show success UI, clear cart, invalidate `payments/history`, `orders/summary/:userId`.
- `/payment-failed` — read `?transactionId`, offer "Retry payment" button that calls `POST /payments/initiate` again with the **same orderId**.
- `/payment-cancelled` — same UX as failed, but with a "Back to cart" CTA.

Set `CLIENT_URL=http://localhost:3000` in the backend `.env` so redirects come back to your dev server.

### 1.4 Purchased list — `GET /payments/history`

Auth: required.

Query params: `?page=1&limit=10`.

Response:

```json
{
  "message": "Payment history retrieved successfully",
  "success": true,
  "data": [
    {
      "_id": "66f5...",
      "orderId": { "_id": "66f3...", "foodName": "Chicken Biryani",
                   "status": "confirmed", "totalPrice": 700, ... },
      "userId": "66e1...",
      "amount": 700,
      "currency": "BDT",
      "transactionId": "TXN-...",
      "status": "completed",
      "createdAt": "2026-05-19T10:11:12.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10, "pages": 1 }
}
```

Filter on the frontend to `status === "completed"` to show **only purchased** items. The same endpoint also returns `pending` / `failed` / `cancelled` rows, which is useful for a "Recent payment attempts" sub-section.

### 1.5 Order summary (optional, for the dashboard widget) — `GET /orders/summary/:userId`

```json
{
  "data": {
    "totalPurchasePrice": 1100,
    "totalPurchaseCount": 2,
    "totalOrderPrice": "1500.00",
    "totalOrderCount": 3
  }
}
```

`Purchase*` counts only `status: "confirmed"` orders; `totalOrder*` counts everything. Use this for the user-profile "lifetime spent" / "orders placed" cards.

### 1.6 Single payment detail (optional, for receipt page) — `GET /payments/:paymentId`

Auth: required. Returns the populated payment + order + user object. Useful for an `/orders/[id]/receipt` page.

---

## 2. Frontend architecture — three feature slices, three agents

If you are dispatching this work to three sub-agents (as the user requested), split it like this. Each slice is independent and only shares types + the HTTP client.

```
src/features/
  orders/      ← Agent A
    api/orders.ts        (createOrder, getOrderSummary)
    hooks/useCreateOrder.ts, useOrderSummary.ts
    schemas/order.ts     (zod, mirrors order.validation.ts)
    types.ts
  payments/    ← Agent B
    api/payments.ts      (initiatePayment, getPaymentHistory, getPaymentDetails)
    hooks/useInitiatePayment.ts, usePaymentHistory.ts
    pages/payment-success, payment-failed, payment-cancelled
    types.ts
  cart/        ← Agent C
    store/useCart.ts     (zustand: items, addItem, removeItem, clear, total)
    components/CartDrawer.tsx, CheckoutButton.tsx
    hooks/usePlaceOrderAndPay.ts   (the orchestrator — see §4)
```

Shared:
```
src/shared/http/client.ts       fetch wrapper with auth header + credentials:"include"
src/shared/http/types.ts        ApiEnvelope<T> = { success, message, data, meta? }
```

### Agent A — Orders slice

**Mission:** wire `POST /orders/create-order` and `GET /orders/summary/:userId`.

Deliverables:
1. `createOrder(cartItems): Promise<Order[]>` — flattens the doubly-nested array the backend returns (`data: [[{…}], [{…}]]`) into `Order[]`.
2. `useCreateOrder()` — TanStack mutation, on success invalidate `["orders", "summary", userId]`.
3. **Validation:** mirror `orderValidations.createOrderZodSchema` exactly. Field names matter (`food` not `foodId`, `foodName` is required).
4. **Diff detection:** compare `cartItems.length` vs `result.length`. If they differ, return `{ orders, skipped: Cart[] }` so the UI can warn "Some items were out of stock or already ordered."

### Agent B — Payments slice

**Mission:** wire `POST /payments/initiate`, `GET /payments/history`, `GET /payments/:paymentId`, and build the 3 callback pages.

Deliverables:
1. `initiatePayment(orderId): Promise<{ paymentUrl, transactionId }>`.
2. `useInitiatePayment()` — on success, **`window.location.href = data.paymentUrl`**. Do not return to the caller, do not show a toast, do not optimistic-anything. The browser is leaving.
3. `usePaymentHistory({ page, limit })` — `useInfiniteQuery` keyed on `["payments", "history", { page, limit }]`.
4. Routes:
   - `/payment-success` — on mount, read `searchParams.transactionId`, call `useCart().clear()`, `queryClient.invalidateQueries(["payments","history"])` and `["orders","summary"]`, show ✓ card with "View purchases" → `/purchases`.
   - `/payment-failed` — show ✗ + retry CTA that calls `initiatePayment(orderId)` with the orderId saved in sessionStorage.
   - `/payment-cancelled` — show neutral state + "Back to cart" CTA.
5. `/purchases` page — uses `usePaymentHistory`, filters `status === "completed"`, renders the populated `orderId.foodName`, `amount`, `createdAt`, `transactionId`.

### Agent C — Cart + checkout orchestration

**Mission:** local cart store + the **one button** that ties orders + payments together.

Deliverables:
1. Zustand store `useCart`:
   ```ts
   type CartItem = { food: string; foodName: string; price: number; quantity: number };
   useCart: { items: CartItem[]; add, remove, updateQty, clear, total }
   ```
2. `usePlaceOrderAndPay()` — the orchestrator. Pseudocode in §4 below.
3. `CheckoutButton` — disabled when cart is empty or user not logged in; on click, calls the orchestrator and shows a single inline status string ("Placing order…" → "Redirecting to payment…").
4. **Do not clear the cart until the success page mounts.** If you clear it on `initiatePayment` success, the user has no way to retry on the failed page.

---

## 3. The HTTP client (shared/http/client.ts)

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json as T;
}
```

Response envelopes are **not** uniform across the codebase — orders use `sendResponse` (`{ statusCode, success, message, data }`), payments use raw JSON (`{ success, message, data }` or `{ success, data, meta }`). Type the response per-endpoint, don't try to write one Envelope generic.

---

## 4. The checkout orchestrator (the heart of the flow)

```ts
// features/cart/hooks/usePlaceOrderAndPay.ts
export function usePlaceOrderAndPay() {
  const { items, clear } = useCart();
  const user = useAuthUser();
  const createOrder   = useCreateOrder();
  const initiatePay   = useInitiatePayment();

  return async () => {
    if (!user) throw new Error("Login required");
    if (items.length === 0) throw new Error("Cart is empty");

    // 1. Build the create-order payload
    const payload = {
      cartItems: items.map(i => ({
        food:       i.food,
        user:       user._id,
        foodName:   i.foodName,
        quantity:   i.quantity,
        price:      i.price,
        totalPrice: i.price * i.quantity,
      })),
    };

    // 2. Place the order
    const orders = await createOrder.mutateAsync(payload);
    if (orders.length === 0) throw new Error("No items could be ordered");

    // 3. (v1) Pay for the first order. Persist the rest as "awaiting payment".
    const primary = orders[0];
    sessionStorage.setItem("pendingOrderId", primary._id);
    sessionStorage.setItem(
      "pendingOrderIds",
      JSON.stringify(orders.map(o => o._id))
    );

    // 4. Kick off SSLCommerz
    const { paymentUrl, transactionId } = await initiatePay.mutateAsync(primary._id);
    sessionStorage.setItem("pendingTxnId", transactionId);

    // 5. Hand control to the gateway — do NOT clear cart here
    window.location.href = paymentUrl;
  };
}
```

On the `/payment-success` page:

```ts
useEffect(() => {
  const txn = new URLSearchParams(location.search).get("transactionId");
  if (!txn) return;
  useCart.getState().clear();
  qc.invalidateQueries({ queryKey: ["payments", "history"] });
  qc.invalidateQueries({ queryKey: ["orders", "summary", user._id] });
  sessionStorage.removeItem("pendingOrderId");
  sessionStorage.removeItem("pendingTxnId");
}, []);
```

---

## 5. End-to-end test recipe (manual, with the SSLCommerz sandbox)

1. **Backend `.env` sanity check** — must have:
   ```
   STORE_ID=…             (from sslcommerz sandbox)
   STORE_PASSWD=…
   IS_LIVE=false
   SERVER_URL=http://localhost:5000
   CLIENT_URL=http://localhost:3000
   ```
   Without these the `paymentUrl` will come back blank and the redirect dies silently.

2. Start backend: `npm run dev` on port 5000. Confirm `GET http://localhost:5000/` returns "Restaurant Operating System Server!".

3. Start frontend: `npm run dev` on port 3000.

4. Log in (so you have a JWT and a user `_id`).

5. Add 1–2 foods to the cart. Click **Place Order & Pay**.

6. You should land on the SSLCommerz sandbox page. Use the test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: any future date
   - CVC: `123`
   - For mobile-banking flows pick **bKash / Nagad / Rocket** from the left rail — sandbox auto-approves.

7. After paying, SSLCommerz → `localhost:5000/api/v1/payments/success` → 302 → `localhost:3000/payment-success?transactionId=TXN-…`.

8. Verify in MongoDB (or via the API):
   - `GET /api/v1/payments/history` → row with `status: "completed"`.
   - `GET /api/v1/orders/<orderId>` → `status: "confirmed"`, `paymentStatus` still `"pending"` (this is a known backend gap — the service updates `order.status` but not `order.paymentStatus`; flag it as a follow-up, do **not** patch around it on the frontend).
   - Cart on the frontend is empty.

9. Negative-path test: place another order, on the SSLCommerz page click **Cancel** → should land on `/payment-cancelled`, cart **still has items**, retry button works.

---

## 6. Known backend gaps to flag (do not work around in the frontend)

| Gap | Impact | Suggested fix on backend |
| --- | --- | --- |
| `verifyPayment` updates `order.status="confirmed"` but never touches `order.paymentStatus`. | The order's `paymentStatus` field stays `"pending"` even after success. | In `payment.service.ts` `verifyPayment`, also `$set: { paymentStatus: "completed" }`. |
| One Order doc per cart item → paying for a multi-item cart needs N payments. | UX friction. | Introduce a parent `Order` with `items[]`, or aggregate `totalPrice` per cart and pay once. |
| `POST /orders/create-order` silently skips duplicates and out-of-stock items. | User sees "success" but ordered fewer items than they thought. | Return a `skipped[]` array in the response so the frontend can surface it. |
| Order routes are not auth-protected (only `PATCH /orders/:id` is admin-gated). | Anyone with the user `_id` can create orders for that user. | Add `auth(USER_ROLE.USER)` to `POST /orders/create-order` and read `user` from `req.user`, not the body. |

When you spot these in the frontend, **do not** try to silently correct them — instead, log a console warning ("Backend gap: paymentStatus not synced") so we can prioritise the fix server-side.

---

## 7. Endpoint cheat-sheet (print this out)

| # | Method | URL | Auth | Body / Query | Used for |
|---|--------|-----|------|--------------|----------|
| 1 | POST   | `/api/v1/orders/create-order` | (token) | `{ cartItems: [...] }` | Place order from cart |
| 2 | POST   | `/api/v1/payments/initiate` | USER | `{ orderId }` | Get SSLCommerz `paymentUrl` |
| 3 | (browser redirect) | `data.paymentUrl` | — | — | Hand off to gateway |
| 4 | (SSLCommerz → server) | `/api/v1/payments/success` etc. | — | — | Server verifies & redirects back |
| 5 | GET    | `/api/v1/payments/history?page=&limit=` | USER | — | Purchased list |
| 6 | GET    | `/api/v1/orders/summary/:userId` | — | — | Dashboard totals |
| 7 | GET    | `/api/v1/payments/:paymentId` | USER | — | Receipt page |
| 8 | GET    | `/api/v1/orders/:orderId` | — | — | Order detail |

That's the whole flow. Build it in the order above and the user can browse → cart → order → pay → see purchases → cart-empty without any extra endpoints.
