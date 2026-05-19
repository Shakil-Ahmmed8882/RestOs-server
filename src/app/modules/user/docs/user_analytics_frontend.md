# User Analytics — Dashboard Integration Guide

> One backend call returns everything a user dashboard needs: lifetime totals, 30-day time-series for charts, top foods, top blogs, engagement. Aggregates across **orders, payments, blogs, comments, replies, saves, votes** in a single round-trip.

**Base URL:** `http://localhost:5000/api/v1`
**Endpoint:** `GET /users/me/analytics` (current user)
**Admin variant:** `GET /users/:userId/analytics`
**Auth:** `Authorization: Bearer <accessToken>` required (USER or ADMIN role).

---

## 1. Request

```
GET /api/v1/users/me/analytics?days=30
```

| Query | Type | Default | Range |
|---|---|---|---|
| `days` | number | `30` | clamped to `[7, 365]` — controls the time-series window |

---

## 2. Response shape

```ts
type UserAnalytics = {
  range: { days: number; from: string; to: string };   // ISO yyyy-mm-dd

  totals: {
    orders: {
      all: number;
      totalValue: number;
      byStatus: {
        pending:   { count: number; totalPrice: number };
        confirmed: { count: number; totalPrice: number };
        canceled:  { count: number; totalPrice: number };
      };
    };
    payments: {
      totalSpent: number;             // sum of completed payments
      successfulCount: number;
      byStatus: {
        pending:   { count: number; amount: number };
        completed: { count: number; amount: number };
        failed:    { count: number; amount: number };
        cancelled: { count: number; amount: number };
      };
    };
    blogs: {
      all: number;
      upvotesReceived: number;
      downvotesReceived: number;
      commentsReceived: number;
      byStatus: {
        pending:          { count: number; upvotes: number; downvotes: number; commentsReceived: number };
        approved:         { count: number; upvotes: number; downvotes: number; commentsReceived: number };
        "test-approved":  { count: number; upvotes: number; downvotes: number; commentsReceived: number };
      };
    };
    activity: {
      commentsWritten: number;
      repliesWritten: number;
      savedBlogs: number;
      votesCast: { upvote: number; downvote: number };
    };
  };

  series: {
    // Each row keyed by date yyyy-mm-dd, **gap-filled with zeros** so the
    // x-axis is continuous and charts never break.
    ordersDaily:   Array<{ date: string; pending: number; confirmed: number; canceled: number; totalPrice: number }>;
    spendDaily:    Array<{ date: string; amount: number; count: number }>;
    blogsDaily:    Array<{ date: string; count: number }>;
    commentsDaily: Array<{ date: string; count: number }>;
  };

  top: {
    foods: Array<{
      foodId: string;
      foodName: string;
      totalQuantity: number;
      totalSpent: number;
      orderCount: number;
    }>;
    blogs: Array<{
      blogId: string;
      title: string;
      upvotes: number;
      downvotes: number;
      commentsCount: number;
      engagementScore: number;        // upvotes + 2*comments - 0.5*downvotes
      createdAt: string;
    }>;
  };
};
```

**Envelope** (the standard backend wrapper):

```json
{
  "success": true,
  "message": "Your analytics retrieved successfully",
  "data": { /* UserAnalytics */ }
}
```

---

## 3. Sample response (abbreviated)

```json
{
  "success": true,
  "message": "Your analytics retrieved successfully",
  "data": {
    "range": { "days": 30, "from": "2026-04-20", "to": "2026-05-19" },
    "totals": {
      "orders": {
        "all": 23,
        "totalValue": 12450.75,
        "byStatus": {
          "pending":   { "count": 3,  "totalPrice": 1850.50 },
          "confirmed": { "count": 15, "totalPrice": 8200.00 },
          "canceled":  { "count": 5,  "totalPrice": 2400.25 }
        }
      },
      "payments": {
        "totalSpent": 8200.00,
        "successfulCount": 15,
        "byStatus": {
          "pending":   { "count": 0, "amount": 0 },
          "completed": { "count": 15, "amount": 8200.00 },
          "failed":    { "count": 1,  "amount": 350 },
          "cancelled": { "count": 2,  "amount": 700 }
        }
      },
      "blogs": {
        "all": 7,
        "upvotesReceived": 124,
        "downvotesReceived": 8,
        "commentsReceived": 36,
        "byStatus": {
          "pending":         { "count": 1, "upvotes": 0,   "downvotes": 0, "commentsReceived": 0 },
          "approved":        { "count": 6, "upvotes": 124, "downvotes": 8, "commentsReceived": 36 },
          "test-approved":   { "count": 0, "upvotes": 0,   "downvotes": 0, "commentsReceived": 0 }
        }
      },
      "activity": {
        "commentsWritten": 42,
        "repliesWritten": 9,
        "savedBlogs": 18,
        "votesCast": { "upvote": 67, "downvote": 4 }
      }
    },
    "series": {
      "ordersDaily":   [{ "date": "2026-04-20", "pending": 0, "confirmed": 1, "canceled": 0, "totalPrice": 350 }, /* …29 more days */],
      "spendDaily":    [{ "date": "2026-04-20", "amount": 350, "count": 1 }, /* …29 more */],
      "blogsDaily":    [{ "date": "2026-04-20", "count": 0 }, /* … */],
      "commentsDaily": [{ "date": "2026-04-20", "count": 2 }, /* … */]
    },
    "top": {
      "foods": [
        { "foodId": "66f2a1...", "foodName": "Chicken Biryani", "totalQuantity": 14, "totalSpent": 4900, "orderCount": 7 }
      ],
      "blogs": [
        { "blogId": "66e1...", "title": "Best pasta tricks", "upvotes": 42, "downvotes": 2, "commentsCount": 11, "engagementScore": 63, "createdAt": "2026-03-12T..." }
      ]
    }
  }
}
```

---

## 4. Frontend integration

### 4.1 Folder layout (extends the existing `src/features/` slices)

```
src/features/dashboard/
  api/analytics.ts              // wraps GET /users/me/analytics
  hooks/useMyAnalytics.ts       // TanStack Query hook
  types.ts                      // UserAnalytics types (paste from §2)
  components/
    StatCard.tsx                // generic KPI card
    SpendLineChart.tsx          // 30-day spend
    OrdersStackedChart.tsx      // pending/confirmed/canceled per day
    EngagementCharts.tsx        // blogs + comments per day
    TopFoodsTable.tsx
    TopBlogsTable.tsx
    ActivityDonut.tsx           // saves / comments / votes split
src/app/(dashboard)/dashboard/
  page.tsx                      // /dashboard
```

### 4.2 `api/analytics.ts`

```ts
import { api } from "@/shared/http/client";
import type { UserAnalytics } from "../types";

export const analyticsApi = {
  me(days: number, token: string) {
    const params = new URLSearchParams({ days: String(days) });
    return api<{ success: true; data: UserAnalytics }>(
      `/users/me/analytics?${params.toString()}`,
      { token }
    );
  },
};
```

### 4.3 `hooks/useMyAnalytics.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { useAuthToken } from "@/features/auth/hooks";
import { analyticsApi } from "../api/analytics";

export function useMyAnalytics(days = 30) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["users", "me", "analytics", days],
    queryFn: () => analyticsApi.me(days, token!),
    enabled: !!token,
    staleTime: 60_000,           // 1 minute — analytics rarely needs to be live
    refetchOnWindowFocus: false,
  });
}
```

### 4.4 The dashboard page — `app/(dashboard)/dashboard/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { useMyAnalytics } from "@/features/dashboard/hooks/useMyAnalytics";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { SpendLineChart } from "@/features/dashboard/components/SpendLineChart";
import { OrdersStackedChart } from "@/features/dashboard/components/OrdersStackedChart";
import { TopFoodsTable } from "@/features/dashboard/components/TopFoodsTable";
import { TopBlogsTable } from "@/features/dashboard/components/TopBlogsTable";
import { ActivityDonut } from "@/features/dashboard/components/ActivityDonut";

const RANGE_OPTIONS = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const q = useMyAnalytics(days);

  if (q.isLoading) return <DashboardSkeleton />;
  if (!q.data) return null;

  const a = q.data.data;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(n);

  return (
    <div className="container space-y-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {RANGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total spent"      value={fmt(a.totals.payments.totalSpent)}
                  hint={`${a.totals.payments.successfulCount} payments`} />
        <StatCard label="Orders placed"    value={a.totals.orders.all}
                  hint={`${a.totals.orders.byStatus.pending.count} still pending`} />
        <StatCard label="Blogs published"  value={a.totals.blogs.all}
                  hint={`${a.totals.blogs.upvotesReceived} upvotes received`} />
        <StatCard label="Saved blogs"      value={a.totals.activity.savedBlogs} />
      </section>

      {/* Time-series charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendLineChart      data={a.series.spendDaily} />
        <OrdersStackedChart  data={a.series.ordersDaily} />
      </section>

      {/* Engagement breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityDonut
          data={{
            comments: a.totals.activity.commentsWritten,
            replies:  a.totals.activity.repliesWritten,
            upvotes:  a.totals.activity.votesCast.upvote,
            downvotes:a.totals.activity.votesCast.downvote,
            saves:    a.totals.activity.savedBlogs,
          }}
        />
        <TopFoodsTable rows={a.top.foods} />
        <TopBlogsTable rows={a.top.blogs} />
      </section>
    </div>
  );
}
```

### 4.5 `SpendLineChart.tsx` (Recharts)

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function SpendLineChart({ data }: { data: { date: string; amount: number; count: number }[] }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">Spending (last {data.length} days)</h3>
      <div className="h-64 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip
              formatter={(v: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(v)}
            />
            <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### 4.6 `OrdersStackedChart.tsx`

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export function OrdersStackedChart({ data }: { data: { date: string; pending: number; confirmed: number; canceled: number }[] }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">Orders per day</h3>
      <div className="h-64 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Legend />
            <Bar dataKey="confirmed" stackId="s" fill="#10b981" />
            <Bar dataKey="pending"   stackId="s" fill="#f59e0b" />
            <Bar dataKey="canceled"  stackId="s" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### 4.7 `TopFoodsTable.tsx`

```tsx
export function TopFoodsTable({ rows }: { rows: UserAnalytics["top"]["foods"] }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(n);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">Top foods (lifetime)</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No confirmed orders yet.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {rows.map(f => (
            <li key={f.foodId} className="py-2 flex items-center justify-between text-sm">
              <span className="font-medium">{f.foodName}</span>
              <span className="text-muted-foreground">×{f.totalQuantity} · {fmt(f.totalSpent)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 4.8 `ActivityDonut.tsx` (Recharts pie)

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function ActivityDonut({ data }: { data: { comments: number; replies: number; upvotes: number; downvotes: number; saves: number } }) {
  const slices = [
    { name: "Comments",  value: data.comments,  fill: "#0ea5e9" },
    { name: "Replies",   value: data.replies,   fill: "#6366f1" },
    { name: "Upvotes",   value: data.upvotes,   fill: "#10b981" },
    { name: "Downvotes", value: data.downvotes, fill: "#f43f5e" },
    { name: "Saves",     value: data.saves,     fill: "#f59e0b" },
  ].filter(s => s.value > 0);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">Your activity</h3>
      <div className="h-64 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## 5. Performance & caching notes

- **One round-trip.** Don't break this into multiple endpoints — the backend already runs everything in parallel via `Promise.all`. Splitting it would 8× the request overhead.
- **`staleTime: 60_000`** on TanStack Query. Analytics rarely needs to be sub-second fresh, and users will rapidly toggle date ranges.
- **Charts use `ResponsiveContainer`** — never hardcode pixel widths. Mobile dashboards rely on this.
- **Time-series rows are gap-filled with zeros** server-side. The frontend never needs to densify or interpolate — just plot the array.
- **`engagementScore`** on top blogs is a *signal*, not a metric. Don't display it as-is to the user; use it only to rank. Show upvotes/comments visibly instead.

---

## 6. UX rules

1. **Default range is 30 days** for first paint. Persist the user's choice in `localStorage` so reopening the dashboard restores it.
2. **Empty data**: every chart must have a friendly empty state — e.g. "No spending in this range yet" rather than a flat zero line.
3. **Currency formatting** is `Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" })`. Don't hardcode "৳" — let the locale do it.
4. **Skeleton on first load only.** When the user changes the date range, keep the previous chart visible (TanStack's `placeholderData: keepPreviousData`) so the dashboard doesn't blank.
5. **Refresh** isn't a button — pulling fresh data happens on tab refocus is **disabled** (`refetchOnWindowFocus: false`) to avoid jitter. Add a manual `Refresh` button only if users ask for one.

---

## 7. Endpoint cheat-sheet

| Method | URL | Auth | Used for |
|---|---|---|---|
| GET | `/users/me/analytics?days=30` | USER | Self dashboard (most common) |
| GET | `/users/:userId/analytics?days=30` | USER/ADMIN | Admin view of any user |

That's the whole thing — one endpoint, one hook, one page, four KPI cards, two time-series charts, three engagement components.
