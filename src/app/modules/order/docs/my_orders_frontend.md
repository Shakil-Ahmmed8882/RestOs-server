# My Orders — Frontend Integration Guide

> User-facing orders page: tables, tabs, counters, search, filters, bulk cancel. Built on top of the user-scoped endpoints on `/api/v1/orders/me*`.

**Base URL:** `http://localhost:5000/api/v1`
**All endpoints below require:** `Authorization: Bearer <accessToken>` and `credentials: "include"`.

---

## 1. Endpoint cheat-sheet

| # | Method | URL | Returns | Use for |
|---|--------|-----|---------|---------|
| 1 | GET | `/orders/me` | paginated `Order[]` + `meta` | The main table — list, filter, search, paginate |
| 2 | GET | `/orders/me/summary` | counters + totals + per-status breakdown | Tab badges, dashboard cards |
| 3 | DELETE | `/orders/me/pending` | `{ cancelled: n }` | "Clear all pending" button |
| 4 | GET | `/orders/:orderId` | single populated `Order` | Detail drawer / receipt row |
| 5 | GET | `/orders/summary/:userId` | (admin-only view of any user) | Optional admin |
| 6 | GET | `/orders/user/:userId` | same shape as `/orders/me` for any user | Admin user-detail page |
| 7 | PATCH | `/orders/:orderId` | updated order | Admin-only — change status |
| 8 | POST | `/orders/create-order` | `Order[]` | Existing checkout flow |

---

## 2. GET /orders/me — the main list

```
GET /api/v1/orders/me?status=pending&page=1&limit=10&sort=-createdAt&searchTerm=biry
```

**Supported query params:**

| Param | Type | Default | Meaning |
|---|---|---|---|
| `status` | `"pending" \| "confirmed" \| "canceled"` | — | Filter by order status |
| `paymentStatus` | `"pending" \| "completed" \| "failed" \| "cancelled"` | — | Filter by payment status |
| `searchTerm` | string | — | Case-insensitive regex on `foodName` |
| `page` | number | `1` | 1-indexed page |
| `limit` | number | `10` | Page size |
| `sort` | string | `-createdAt` | Mongo sort spec — prefix `-` for desc. Useful: `-createdAt`, `totalPrice`, `-totalPrice` |
| `fields` | string | — | Comma-separated projection (e.g. `foodName,totalPrice,status`) |
| `minPrice`, `maxPrice` | number | — | Range filter on `price` |

**Response:**

```json
{
  "success": true,
  "message": "Your orders retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "totalPage": 3
  },
  "data": [
    {
      "_id": "66f3a1...",
      "food": {
        "_id": "66f2a1...",
        "name": "Chicken Biryani",
        "price": 350,
        "image": "https://...",
        "category": "..."
      },
      "user": { "_id": "66e1...", "name": "...", "email": "..." },
      "foodName": "Chicken Biryani",
      "price": 350,
      "totalPrice": 700,
      "quantity": 2,
      "status": "pending",
      "paymentStatus": "pending",
      "createdAt": "2026-05-19T12:00:00.000Z",
      "updatedAt": "2026-05-19T12:00:00.000Z"
    }
  ]
}
```

---

## 3. GET /orders/me/summary — counters and totals

```
GET /api/v1/orders/me/summary
```

**Response:**

```json
{
  "success": true,
  "message": "Your order summary retrieved successfully",
  "data": {
    "totalOrderCount": 23,
    "totalOrderPrice": 12450.75,

    "totalPurchaseCount": 15,         // legacy alias: byStatus.confirmed.count
    "totalPurchasePrice": 8200.00,    // legacy alias: byStatus.confirmed.totalPrice

    "byStatus": {
      "pending":   { "count": 3, "totalPrice": 1850.50 },
      "confirmed": { "count": 15, "totalPrice": 8200.00 },
      "canceled":  { "count": 5, "totalPrice": 2400.25 }
    }
  }
}
```

Use `byStatus` for tab badges. Use `totalPurchase*` for "Lifetime spent" / "Orders placed" cards.

---

## 4. DELETE /orders/me/pending — clear pending list

```
DELETE /api/v1/orders/me/pending
```

Marks every order with `status: "pending"` for the calling user as `status: "canceled"` + `paymentStatus: "cancelled"`. The orders stay in the database so they keep showing in the "Cancelled" tab.

**Response:**

```json
{
  "success": true,
  "message": "Cancelled 3 pending orders",
  "data": { "cancelled": 3 }
}
```

After calling this, invalidate `["orders","me","list"]` and `["orders","me","summary"]`.

---

## 5. Frontend architecture — the My Orders page

### 5.1 Folder layout (continues the existing `src/features/orders/` slice)

```
src/features/orders/
  api/
    orders.ts                  // existing
    myOrders.ts                // NEW — wraps /orders/me*
  hooks/
    useMyOrders.ts             // NEW — useInfiniteQuery / useQuery
    useMyOrdersSummary.ts      // NEW
    useCancelMyPending.ts      // NEW — useMutation
  components/
    OrdersTable.tsx            // NEW — generic table for one tab
    OrdersTabs.tsx             // NEW — Pending / Confirmed / Cancelled / All
    OrdersFilters.tsx          // NEW — searchTerm + price range + date
    OrdersSummaryCards.tsx     // NEW — totals at the top
  types.ts
src/app/(public)/orders/
  page.tsx                     // /orders — renders the tabs + table
```

### 5.2 `api/myOrders.ts`

```ts
import { api } from "@/shared/http/client";

export interface MyOrder {
  _id: string;
  food: { _id: string; name: string; image?: string; price: number };
  foodName: string;
  price: number;
  totalPrice: number;
  quantity: number;
  status: "pending" | "confirmed" | "canceled";
  paymentStatus: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface MyOrdersQuery {
  status?: "pending" | "confirmed" | "canceled";
  paymentStatus?: "pending" | "completed" | "failed" | "cancelled";
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface MyOrdersResponse {
  success: true;
  message: string;
  data: MyOrder[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}

export interface MyOrdersSummary {
  totalOrderCount: number;
  totalOrderPrice: number;
  totalPurchaseCount: number;
  totalPurchasePrice: number;
  byStatus: {
    pending:   { count: number; totalPrice: number };
    confirmed: { count: number; totalPrice: number };
    canceled:  { count: number; totalPrice: number };
  };
}

export const myOrdersApi = {
  list(q: MyOrdersQuery, token: string) {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
    });
    return api<MyOrdersResponse>(`/orders/me?${params.toString()}`, { token });
  },
  summary(token: string) {
    return api<{ success: true; data: MyOrdersSummary }>(`/orders/me/summary`, {
      token,
    });
  },
  cancelPending(token: string) {
    return api<{ success: true; data: { cancelled: number } }>(
      `/orders/me/pending`,
      { method: "DELETE", token }
    );
  },
};
```

### 5.3 `hooks/useMyOrders.ts`

```ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { myOrdersApi, MyOrdersQuery } from "../api/myOrders";
import { useAuthToken } from "@/features/auth/hooks";

export function useMyOrders(q: MyOrdersQuery) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["orders", "me", "list", q],
    queryFn: () => myOrdersApi.list(q, token!),
    enabled: !!token,
    placeholderData: keepPreviousData,    // smooth pagination
    staleTime: 30_000,
  });
}
```

### 5.4 `hooks/useMyOrdersSummary.ts`

```ts
export function useMyOrdersSummary() {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["orders", "me", "summary"],
    queryFn: () => myOrdersApi.summary(token!),
    enabled: !!token,
    staleTime: 60_000,
  });
}
```

### 5.5 `hooks/useCancelMyPending.ts`

```ts
export function useCancelMyPending() {
  const token = useAuthToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => myOrdersApi.cancelPending(token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "me"] });
    },
  });
}
```

### 5.6 The page — `app/(public)/orders/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { OrdersSummaryCards } from "@/features/orders/components/OrdersSummaryCards";
import { OrdersTabs } from "@/features/orders/components/OrdersTabs";
import { OrdersFilters } from "@/features/orders/components/OrdersFilters";
import { OrdersTable } from "@/features/orders/components/OrdersTable";
import { useMyOrders } from "@/features/orders/hooks/useMyOrders";
import { useMyOrdersSummary } from "@/features/orders/hooks/useMyOrdersSummary";

type Tab = "pending" | "confirmed" | "canceled" | "all";

export default function MyOrdersPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const summary = useMyOrdersSummary();
  const list = useMyOrders({
    status: tab === "all" ? undefined : tab,
    searchTerm: search || undefined,
    page,
    limit: 10,
    sort: "-createdAt",
  });

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Orders</h1>
      </header>

      <OrdersSummaryCards data={summary.data?.data} loading={summary.isLoading} />

      <OrdersTabs
        active={tab}
        onChange={(t) => { setTab(t); setPage(1); }}
        counts={summary.data?.data.byStatus}
      />

      <OrdersFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
      />

      <OrdersTable
        rows={list.data?.data ?? []}
        meta={list.data?.meta}
        page={page}
        onPageChange={setPage}
        loading={list.isLoading}
      />
    </div>
  );
}
```

### 5.7 `OrdersTabs.tsx` — Pending / Confirmed / Cancelled / All

```tsx
type ByStatus = { pending: {count:number}; confirmed: {count:number}; canceled: {count:number} };

export function OrdersTabs({
  active, onChange, counts,
}: {
  active: "pending" | "confirmed" | "canceled" | "all";
  onChange: (t: any) => void;
  counts?: ByStatus;
}) {
  const tabs = [
    { key: "pending",   label: "Pending",   n: counts?.pending.count   },
    { key: "confirmed", label: "Purchased", n: counts?.confirmed.count },
    { key: "canceled",  label: "Cancelled", n: counts?.canceled.count  },
    { key: "all",       label: "All",       n: (counts?.pending.count ?? 0)
                                            + (counts?.confirmed.count ?? 0)
                                            + (counts?.canceled.count ?? 0) },
  ] as const;

  return (
    <nav className="flex gap-2 border-b">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 -mb-px border-b-2 ${
            active === t.key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
          {t.n !== undefined && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-muted text-xs">
              {t.n}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
```

### 5.8 `OrdersTable.tsx` — the actual table

```tsx
import { MyOrder, MyOrdersResponse } from "../api/myOrders";

const fmtBDT = (n: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(n);

const statusBadge = (s: MyOrder["status"]) => {
  const styles = {
    pending:   "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    canceled:  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  };
  return styles[s];
};

export function OrdersTable({
  rows, meta, page, onPageChange, loading,
}: {
  rows: MyOrder[];
  meta?: MyOrdersResponse["meta"];
  page: number;
  onPageChange: (p: number) => void;
  loading: boolean;
}) {
  if (loading) return <TableSkeleton />;
  if (rows.length === 0) return <EmptyState />;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <Th>Food</Th>
            <Th>Qty</Th>
            <Th align="right">Unit price</Th>
            <Th align="right">Total</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
            <Th>Placed</Th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(o => (
            <tr key={o._id} className="hover:bg-muted/30">
              <Td>
                <div className="flex items-center gap-3">
                  {o.food?.image && (
                    <img src={o.food.image} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="font-medium">{o.foodName}</div>
                </div>
              </Td>
              <Td>{o.quantity}</Td>
              <Td align="right">{fmtBDT(o.price)}</Td>
              <Td align="right" className="font-medium">{fmtBDT(o.totalPrice)}</Td>
              <Td>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(o.status)}`}>
                  {o.status}
                </span>
              </Td>
              <Td className="text-muted-foreground">{o.paymentStatus}</Td>
              <Td className="text-muted-foreground">
                {new Date(o.createdAt).toLocaleDateString()}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      {meta && meta.totalPage > 1 && (
        <Pagination meta={meta} page={page} onChange={onPageChange} />
      )}
    </div>
  );
}
```

### 5.9 `OrdersSummaryCards.tsx`

```tsx
export function OrdersSummaryCards({ data, loading }: { data?: MyOrdersSummary; loading?: boolean }) {
  if (loading || !data) return <CardSkeletons />;

  const cards = [
    { label: "Total orders",    value: data.totalOrderCount,         hint: fmtBDT(data.totalOrderPrice) },
    { label: "Purchased",       value: data.byStatus.confirmed.count, hint: fmtBDT(data.byStatus.confirmed.totalPrice) },
    { label: "Pending",         value: data.byStatus.pending.count,   hint: fmtBDT(data.byStatus.pending.totalPrice) },
    { label: "Cancelled",       value: data.byStatus.canceled.count,  hint: fmtBDT(data.byStatus.canceled.totalPrice) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}
```

### 5.10 "Clear pending" action

A button on the Pending tab header — visible only when `byStatus.pending.count > 0`:

```tsx
const cancel = useCancelMyPending();

<Button
  variant="destructive"
  disabled={cancel.isPending || (summary?.byStatus.pending.count ?? 0) === 0}
  onClick={() => {
    if (confirm("Cancel all pending orders? This cannot be undone.")) {
      cancel.mutate();
    }
  }}
>
  Clear all pending
</Button>
```

After the mutation succeeds, the existing `onSuccess` in `useCancelMyPending` invalidates `["orders","me"]` which refetches both the list and the summary — counters update automatically.

---

## 6. Invalidation rules — when to refresh which keys

| Event | Invalidate |
|---|---|
| User places new orders (`POST /orders/create-order`) | `["orders","me"]` + `["orders","me","summary"]` |
| Payment success page mounts | `["orders","me"]` + `["payments","history"]` (already documented in `order_payment_frontend_flow.md` §4.1) |
| Payment fail/cancel page mounts | `["orders","me"]` (re-read pending counts) |
| User clicks "Clear all pending" | `["orders","me"]` |
| Admin updates an order status | `["orders","me"]` |

Use a wildcard pattern: `qc.invalidateQueries({ queryKey: ["orders", "me"] })` — TanStack v5 invalidates every key whose tuple starts with that prefix, so both `list` and `summary` get refetched in one call.

---

## 7. UX rules — small details that matter

1. **The Pending tab is the default landing tab** — it's the most actionable view (user can pay or cancel from here).
2. **Empty state per tab** is different:
   - Pending → "No pending orders. Add items to your cart to place one."
   - Purchased → "You haven't completed any purchases yet."
   - Cancelled → "Nothing here." (less prominent — it's an archive)
3. **Status badges** use the same color tokens as the rest of the app (amber/emerald/rose). Don't invent new colors.
4. **`paymentStatus`** is a secondary column — show it in muted text. It only matters when investigating a failed payment.
5. **Click a row** → open a `OrderDetailDrawer` calling `GET /orders/:orderId` (already exists). Don't navigate away.
6. **Debounce the search input** by 300ms before triggering the query — otherwise every keystroke fires a request.
7. **`keepPreviousData`** on the list query is non-negotiable — the table shouldn't blank out between pages.

---

## 8. End-to-end test recipe

1. Log in as a user with a few orders.
2. Visit `/orders` → Pending tab loads with the correct count badge.
3. Switch to Purchased → the table re-fetches with `status=confirmed`.
4. Type a few characters in the search → table filters by `foodName`.
5. Click "Clear all pending" → all pending rows disappear, the Pending badge drops to 0, the Cancelled badge increases by the same amount.
6. Place a new order via the checkout flow → Pending count goes back to 1, the new row shows on top of the Pending tab.
7. Pay successfully → Pending drops to 0, Purchased increases by 1 (the backend already cancels the stale pendings as part of `verifyPayment`, see `order_payment_frontend_flow.md` §4.1).

---

## 9. Endpoint cheat-sheet (print this)

| # | Method | URL | Auth | Used for |
|---|--------|-----|------|----------|
| 1 | GET    | `/orders/me?status=&page=&limit=&searchTerm=&sort=` | USER | Main table |
| 2 | GET    | `/orders/me/summary` | USER | Counters + totals |
| 3 | DELETE | `/orders/me/pending` | USER | "Clear all pending" |
| 4 | GET    | `/orders/:orderId` | — | Detail drawer |
| 5 | GET    | `/orders/user/:userId` | USER/ADMIN | Admin view of another user |
| 6 | GET    | `/orders/summary/:userId` | — | Admin user detail page |
| 7 | PATCH  | `/orders/:orderId` | ADMIN | Status edits |
| 8 | POST   | `/orders/create-order` | — | Existing checkout |

That's everything you need to build the My Orders screen end-to-end.
