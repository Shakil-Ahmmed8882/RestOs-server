# My Blogs — Frontend Integration Guide

> User-facing "My blogs" page: paginated list of the signed-in user's blogs, with status tabs (Pending / Approved / Test-approved), search, sort, and a stats header (engagement totals + recent activity).

**Base URL:** `http://localhost:5000/api/v1`
**Auth:** `Authorization: Bearer <accessToken>` required on every endpoint here.

---

## 1. Endpoint cheat-sheet

| # | Method | URL | Returns | Use for |
|---|--------|-----|---------|---------|
| 1 | GET | `/blogs/me` | paginated `Blog[]` + `meta` | The blogs table |
| 2 | GET | `/blogs/me/stats` | per-status counters + engagement totals + 5 recent | Tab badges + dashboard cards |
| 3 | GET | `/blogs/:id` | single populated `Blog` | Detail drawer / preview |
| 4 | PATCH | `/blogs/:id` | updated blog | Inline edits from the row |
| 5 | DELETE | `/blogs/:id` | `{}` | "Delete" action |
| 6 | POST | `/blogs/create` | created blog | Existing "New post" flow |

`/blogs/me*` resolve the author from the JWT — no `userId` ever needs to be passed.

---

## 2. GET /blogs/me — the main list

```
GET /api/v1/blogs/me?status=approved&page=1&limit=10&sort=-createdAt&searchTerm=pasta
```

**Supported query params:**

| Param | Type | Default | Meaning |
|---|---|---|---|
| `status` | `"pending" \| "approved" \| "test-approved"` | — | Filter by approval status |
| `searchTerm` | string | — | Case-insensitive regex on `title` and `category` |
| `page` | number | `1` | 1-indexed page |
| `limit` | number | `10` | Page size |
| `sort` | string | `-createdAt` | Mongo sort spec — prefix `-` for desc. Useful: `-createdAt`, `-upvotes`, `-commentsCount` |
| `fields` | string | — | Comma-separated projection (`title,upvotes,status`) |
| `includeDeleted` | `"true"` | `false` | Include soft-deleted blogs (for a "Trash" tab if you build one) |

**Response:**

```json
{
  "success": true,
  "message": "Your blogs retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 7, "totalPage": 1 },
  "data": [
    {
      "_id": "66f3a1...",
      "title": "Best pasta tricks",
      "category": "italian",
      "description": "Three ways to...",
      "tags": ["pasta", "quick"],
      "instructions": ["Boil water", "Add salt", "..."],
      "image": "https://res.cloudinary.com/.../blog-foo.jpg",
      "imagePublicId": "blogs/blog-foo",
      "author": { "user": "66e1...", "name": "Maryam" },
      "status": "approved",
      "isDeleted": false,
      "upvotes": 42,
      "downvotes": 2,
      "commentsCount": 11,
      "createdAt": "2026-03-12T...",
      "updatedAt": "2026-03-15T..."
    }
  ]
}
```

> Note: this endpoint does NOT populate `author.user` because the consumer already *is* that user. If you need it, hit `/blogs/:id` for the detail view.

---

## 3. GET /blogs/me/stats — counters + engagement

```
GET /api/v1/blogs/me/stats
```

**Response:**

```json
{
  "success": true,
  "message": "Your blog stats retrieved successfully",
  "data": {
    "totalBlogs": 7,
    "totalUpvotes": 124,
    "totalDownvotes": 8,
    "totalCommentsReceived": 36,
    "netVotes": 116,

    "byStatus": {
      "pending":         { "count": 1, "upvotes": 0,   "downvotes": 0, "commentsReceived": 0  },
      "approved":        { "count": 6, "upvotes": 124, "downvotes": 8, "commentsReceived": 36 },
      "test-approved":   { "count": 0, "upvotes": 0,   "downvotes": 0, "commentsReceived": 0  }
    },

    "recent": [
      {
        "_id": "66f3...",
        "title": "Best pasta tricks",
        "status": "approved",
        "upvotes": 42, "downvotes": 2, "commentsCount": 11,
        "image": "https://...",
        "createdAt": "2026-03-12T..."
      }
      /* up to 5 most recent */
    ]
  }
}
```

Use `byStatus.*.count` for the tab badges. Use the top-level totals for KPI cards. Use `recent` for a "Latest activity" sidebar.

---

## 4. Frontend architecture

### 4.1 Folder layout (extends existing `src/features/blogs/`)

```
src/features/blogs/
  api/
    blogs.ts                   // existing
    myBlogs.ts                 // NEW — /blogs/me, /blogs/me/stats
  hooks/
    useMyBlogs.ts              // NEW
    useMyBlogsStats.ts         // NEW
    useUpdateBlog.ts           // existing
    useDeleteBlog.ts           // existing
  components/
    MyBlogsTabs.tsx            // NEW — Pending / Approved / Test-approved / All
    MyBlogsTable.tsx           // NEW — row-per-blog with status, votes, comments
    MyBlogsStatsCards.tsx      // NEW — 4 KPI cards
    RecentBlogsList.tsx        // NEW — uses stats.recent
  types.ts                     // share with /blogs feed
src/app/(dashboard)/blogs/
  page.tsx                     // /dashboard/blogs (or wherever it lives)
```

### 4.2 `api/myBlogs.ts`

```ts
import { api } from "@/shared/http/client";

export type BlogStatus = "pending" | "approved" | "test-approved";

export interface MyBlog {
  _id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  instructions: string[];
  image: string;
  imagePublicId?: string | null;
  author: { user: string; name: string };
  status: BlogStatus;
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyBlogsQuery {
  status?: BlogStatus;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
  includeDeleted?: boolean;
}

export interface MyBlogsListResponse {
  success: true;
  message: string;
  data: MyBlog[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}

export interface MyBlogsStats {
  totalBlogs: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalCommentsReceived: number;
  netVotes: number;
  byStatus: Record<
    BlogStatus,
    { count: number; upvotes: number; downvotes: number; commentsReceived: number }
  >;
  recent: Array<
    Pick<MyBlog, "_id" | "title" | "status" | "upvotes" | "downvotes" | "commentsCount" | "image" | "createdAt">
  >;
}

export const myBlogsApi = {
  list(q: MyBlogsQuery, token: string) {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
    });
    return api<MyBlogsListResponse>(`/blogs/me?${params.toString()}`, { token });
  },
  stats(token: string) {
    return api<{ success: true; data: MyBlogsStats }>(`/blogs/me/stats`, { token });
  },
};
```

### 4.3 `hooks/useMyBlogs.ts`

```ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { myBlogsApi, MyBlogsQuery } from "../api/myBlogs";
import { useAuthToken } from "@/features/auth/hooks";

export function useMyBlogs(q: MyBlogsQuery) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["blogs", "me", "list", q],
    queryFn: () => myBlogsApi.list(q, token!),
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
```

### 4.4 `hooks/useMyBlogsStats.ts`

```ts
export function useMyBlogsStats() {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["blogs", "me", "stats"],
    queryFn: () => myBlogsApi.stats(token!),
    enabled: !!token,
    staleTime: 60_000,
  });
}
```

### 4.5 The page — `app/(dashboard)/blogs/page.tsx`

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useMyBlogs } from "@/features/blogs/hooks/useMyBlogs";
import { useMyBlogsStats } from "@/features/blogs/hooks/useMyBlogsStats";
import { MyBlogsStatsCards } from "@/features/blogs/components/MyBlogsStatsCards";
import { MyBlogsTabs } from "@/features/blogs/components/MyBlogsTabs";
import { MyBlogsTable } from "@/features/blogs/components/MyBlogsTable";
import type { BlogStatus } from "@/features/blogs/api/myBlogs";

type Tab = BlogStatus | "all";

export default function MyBlogsPage() {
  const [tab, setTab] = useState<Tab>("approved");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const stats = useMyBlogsStats();
  const list = useMyBlogs({
    status: tab === "all" ? undefined : tab,
    searchTerm: search || undefined,
    page,
    limit: 10,
    sort: "-createdAt",
  });

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My blogs</h1>
        <Link
          href="/blogs/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New blog
        </Link>
      </header>

      <MyBlogsStatsCards data={stats.data?.data} loading={stats.isLoading} />

      <MyBlogsTabs
        active={tab}
        counts={stats.data?.data.byStatus}
        onChange={(t) => { setTab(t); setPage(1); }}
      />

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search title or category…"
          className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <MyBlogsTable
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

### 4.6 `MyBlogsTabs.tsx`

```tsx
import type { MyBlogsStats } from "../api/myBlogs";

type Tab = "pending" | "approved" | "test-approved" | "all";

export function MyBlogsTabs({
  active, onChange, counts,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  counts?: MyBlogsStats["byStatus"];
}) {
  const all =
    (counts?.pending.count ?? 0) +
    (counts?.approved.count ?? 0) +
    (counts?.["test-approved"].count ?? 0);

  const tabs: { key: Tab; label: string; n?: number }[] = [
    { key: "approved",      label: "Approved",      n: counts?.approved.count },
    { key: "pending",       label: "Pending",       n: counts?.pending.count },
    { key: "test-approved", label: "Test-approved", n: counts?.["test-approved"].count },
    { key: "all",           label: "All",           n: all },
  ];

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

### 4.7 `MyBlogsTable.tsx`

```tsx
import Link from "next/link";
import { ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import { useUpdateBlog, useDeleteBlog } from "../hooks";
import type { MyBlog, MyBlogsListResponse } from "../api/myBlogs";

const statusBadge = (s: MyBlog["status"]) => ({
  pending:        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  approved:       "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "test-approved":"bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
}[s]);

export function MyBlogsTable({
  rows, meta, page, onPageChange, loading,
}: {
  rows: MyBlog[];
  meta?: MyBlogsListResponse["meta"];
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
            <Th>Title</Th>
            <Th>Status</Th>
            <Th align="right">Upvotes</Th>
            <Th align="right">Downvotes</Th>
            <Th align="right">Comments</Th>
            <Th>Posted</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(b => (
            <tr key={b._id} className="hover:bg-muted/30">
              <Td>
                <Link href={`/blogs/${b._id}`} className="flex items-center gap-3 hover:underline">
                  {b.image && <img src={b.image} alt="" className="w-10 h-10 rounded object-cover" />}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{b.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.category}</div>
                  </div>
                </Link>
              </Td>
              <Td>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                  {b.status}
                </span>
              </Td>
              <Td align="right" className="font-medium">
                <span className="inline-flex items-center gap-1"><ChevronUp size={14} />{b.upvotes}</span>
              </Td>
              <Td align="right" className="text-muted-foreground">
                <span className="inline-flex items-center gap-1"><ChevronDown size={14} />{b.downvotes}</span>
              </Td>
              <Td align="right" className="text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MessageSquare size={14} />{b.commentsCount}</span>
              </Td>
              <Td className="text-muted-foreground">
                {new Date(b.createdAt).toLocaleDateString()}
              </Td>
              <Td>
                <RowActions blog={b} />
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

### 4.8 `MyBlogsStatsCards.tsx`

```tsx
import type { MyBlogsStats } from "../api/myBlogs";

export function MyBlogsStatsCards({ data, loading }: { data?: MyBlogsStats; loading?: boolean }) {
  if (loading || !data) return <CardSkeletons />;

  const net = data.netVotes;
  const netClass = net >= 0 ? "text-emerald-600" : "text-rose-600";

  const cards = [
    { label: "Total blogs",    value: data.totalBlogs,
      hint: `${data.byStatus.approved.count} approved · ${data.byStatus.pending.count} pending` },
    { label: "Upvotes",        value: data.totalUpvotes,
      hint: `Net ${net >= 0 ? "+" : ""}${net}`,
      hintClass: netClass },
    { label: "Comments",       value: data.totalCommentsReceived,
      hint: "received across all posts" },
    { label: "Downvotes",      value: data.totalDownvotes,
      hint: data.totalDownvotes === 0 ? "🎉 none" : "see worst-performing post" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          {c.hint && <div className={`mt-1 text-xs ${c.hintClass ?? "text-muted-foreground"}`}>{c.hint}</div>}
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Invalidation rules

| Event | Invalidate |
|---|---|
| User publishes a new blog (`POST /blogs/create`) | `["blogs","me"]` |
| User edits a blog (`PATCH /blogs/:id`) | `["blogs","me"]` |
| User deletes a blog (`DELETE /blogs/:id`) | `["blogs","me"]` |
| Admin moderates and changes status | `["blogs","me"]` |
| Someone upvotes/comments on a blog the user authored | `["blogs","me","stats"]` (eventually consistent — `staleTime: 60s` already covers the typical case) |

`qc.invalidateQueries({ queryKey: ["blogs","me"] })` will refetch both the list and the stats in one call (TanStack v5 prefix-matches).

---

## 6. UX rules

1. **Default tab is "Approved"** — it's the most useful view (what the audience sees).
2. **Empty states per tab:**
   - Approved → "No approved blogs yet. Once an admin reviews your draft it'll show up here."
   - Pending → "Nothing waiting on review." (or, if user has zero blogs, "Write your first blog →")
   - Test-approved → "No test posts." (keep this subtle — it's a niche state)
   - All → "You haven't written any blogs yet."
3. **Status badge colors** are amber/emerald/sky — matches the patterns used in My Orders so the UI feels consistent.
4. **Debounce search** by 300ms before firing the query.
5. **`keepPreviousData`** on the list query — no flashing white between pages.
6. **Click a row → blog detail page** (`/blogs/:id`). Don't open a drawer for *own* blogs — the user wants to see how it actually looks to the public, plus the "Edit" button is on that page already.
7. **Row actions:** Edit (→ `/blogs/:id/edit`), Delete (confirm dialog), Copy public link. Don't put more than three actions inline; overflow into a `…` menu.

---

## 7. End-to-end test recipe

1. Log in.
2. Visit `/dashboard/blogs` → Approved tab loads with the count badge.
3. Switch to Pending → table re-fetches with `status=pending`.
4. Type a few characters in the search → table filters by title/category.
5. Click "New blog" → existing flow → submit → return to the list → the new draft appears under "Pending" with the badge incremented.
6. Click "Delete" on an approved blog → confirm → row disappears, badge decrements.
7. The stats KPIs and tab badges update on every list refetch via the shared `["blogs","me"]` cache invalidation.

---

## 8. Endpoint cheat-sheet (print this)

| # | Method | URL | Auth | Used for |
|---|--------|-----|------|----------|
| 1 | GET    | `/blogs/me?status=&page=&limit=&searchTerm=&sort=` | USER/ADMIN | Main table |
| 2 | GET    | `/blogs/me/stats` | USER/ADMIN | Counters + engagement totals + recent |
| 3 | GET    | `/blogs/:id` | — | Detail view |
| 4 | PATCH  | `/blogs/:id` | — | Edit |
| 5 | DELETE | `/blogs/:id` | — | Delete |

That's everything. One hook for the list, one hook for the stats, four KPI cards, one table with four status tabs.
