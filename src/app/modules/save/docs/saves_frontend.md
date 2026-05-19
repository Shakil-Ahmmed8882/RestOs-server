# Saves — Frontend Integration Guide (polymorphic: blog + food)

> Saves are now generic. A user can save a **blog** or a **food** via the same endpoints, distinguished by a `type` discriminator. The `/saves` page on the frontend shows two tabs (Blogs / Foods) that filter the same list.

**Base URL:** `http://localhost:5000/api/v1`
**Mount path:** `/saves`
**Auth:** every endpoint requires `Authorization: Bearer <accessToken>` (USER or ADMIN).

---

## 1. Endpoint cheat-sheet

| # | Method | URL | Returns | Use for |
|---|--------|-----|---------|---------|
| 1 | GET | `/saves` | paginated saves + `meta` | The "Saved" page list |
| 2 | GET | `/saves?type=blog` | filtered (blog tab) | Blogs tab |
| 3 | GET | `/saves?type=food` | filtered (foods tab) | Foods tab |
| 4 | GET | `/saves/counts` | `{ blog, food, total }` | Tab badges |
| 5 | POST | `/saves/:type/:itemId` | created save row | "Save" button on a blog or food card |
| 6 | DELETE | `/saves/:type/:itemId` | `{ deletedCount }` | "Unsave" button |
| 7 | GET | `/saves/:type/:itemId/is-saved` | `{ isSaved, type, itemId }` | Toggle UI on detail pages |

**`:type`** is one of `blog` | `food` — anything else returns **400 Bad Request**.

---

## 2. The save row — what `/saves` returns

Each row in the list response is a **reference** to the underlying blog/food. We **do not duplicate** title/image/price into the save — those come live via populate, so deletes and edits on the source flow through automatically.

```ts
type SaveRow = {
  _id: string;
  type: "blog" | "food";
  itemId: string;                  // ObjectId of the saved blog/food
  name: string;                    // cached label (blog.title or food.foodName)
  savedAt: string;                 // ISO date
  createdAt: string;
  updatedAt: string;

  // The live, current resource — null if it's been deleted since being saved.
  resource:
    | null
    | {
        // when type === "blog":
        _id: string;
        title: string;
        image: string;
        category: string;
        status: "pending" | "approved" | "test-approved";
        upvotes: number;
        commentsCount: number;
      }
    | {
        // when type === "food":
        _id: string;
        foodName: string;
        foodImage: string;
        foodCategory: string;
        price: number;
        discountPercent: number;
        status: string;
      };

  resourceDeleted: boolean;        // true if the underlying blog/food was deleted
};
```

> If `resourceDeleted: true`, render a tombstone card ("This item was removed by its author") with an "Unsave" action. Don't crash on `resource === null`.

---

## 3. Sample requests / responses

### Save a blog

```
POST /api/v1/saves/blog/66f3a1b2c3d4e5f6a7b8c9d0
```

```json
{
  "success": true,
  "message": "blog saved successfully",
  "data": {
    "_id": "...",
    "user": "66e1...",
    "type": "blog",
    "item": "66f3a1...",
    "name": "Best pasta tricks",
    "createdAt": "2026-05-19T..."
  }
}
```

### Save a food

```
POST /api/v1/saves/food/66f2aabbccddeeff00112233
```

Identical response shape, `type: "food"` and `name` is the food's `foodName`.

### Unsave

```
DELETE /api/v1/saves/blog/66f3a1...
DELETE /api/v1/saves/food/66f2aa...
```

```json
{ "success": true, "message": "blog unsaved successfully", "data": { "acknowledged": true, "deletedCount": 1 } }
```

### Is saved?

```
GET /api/v1/saves/blog/66f3a1.../is-saved
```

```json
{ "success": true, "data": { "isSaved": true, "type": "blog", "itemId": "66f3a1..." } }
```

### List — Blogs tab

```
GET /api/v1/saves?type=blog&page=1&limit=10&searchTerm=pasta&sort=-createdAt
```

```json
{
  "success": true,
  "message": "Saved items retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 12, "totalPage": 2 },
  "data": [
    {
      "_id": "save-id",
      "type": "blog",
      "itemId": "66f3a1...",
      "name": "Best pasta tricks",
      "savedAt": "2026-05-19T...",
      "createdAt": "2026-05-19T...",
      "updatedAt": "2026-05-19T...",
      "resource": {
        "_id": "66f3a1...",
        "title": "Best pasta tricks",
        "image": "https://...",
        "category": "italian",
        "status": "approved",
        "upvotes": 42,
        "commentsCount": 11
      },
      "resourceDeleted": false
    }
  ]
}
```

### List — Foods tab

```
GET /api/v1/saves?type=food&page=1&limit=10
```

Same envelope; rows have `type: "food"` and `resource` carries `foodName / foodImage / price / discountPercent / foodCategory / status`.

### Counts (tab badges)

```
GET /api/v1/saves/counts
```

```json
{
  "success": true,
  "message": "Saved counts retrieved successfully",
  "data": { "blog": 12, "food": 7, "total": 19 }
}
```

---

## 4. Query params supported on `GET /saves`

| Param | Type | Default | Meaning |
|---|---|---|---|
| `type` | `"blog" \| "food"` | — | Filter the list to a single type. Required for the tabs. |
| `searchTerm` | string | — | Case-insensitive regex on `name` (the cached label) |
| `page` | number | `1` | 1-indexed page |
| `limit` | number | `10` | Page size |
| `sort` | string | `-createdAt` | Mongo sort spec |
| `fields` | string | — | Comma-separated projection on the save document itself |

> **Note:** `searchTerm` matches the cached `name` only — it doesn't search inside the populated blog/food. That's intentional (fast, no extra joins). For richer search use the dedicated feed endpoints (`/blogs`, `/foods`).

---

## 5. Frontend architecture

### 5.1 Folder layout

```
src/features/saves/
  api/saves.ts                 // wraps all /saves endpoints
  hooks/
    useMySaves.ts              // useQuery — list (per tab)
    useSaveCounts.ts           // useQuery — tab badges
    useToggleSave.ts           // useMutation — save or unsave from any card
    useIsSaved.ts              // useQuery — for detail-page "Saved/Save" toggle
  components/
    SavesTabs.tsx              // Blogs | Foods
    SavedBlogCard.tsx          // renders one save row when type === "blog"
    SavedFoodCard.tsx          // renders one save row when type === "food"
    SaveButton.tsx             // generic toggle, used on any blog/food card
  types.ts                     // SaveRow + helpers
src/app/(public)/saves/
  page.tsx                     // /saves
```

### 5.2 `api/saves.ts`

```ts
import { api } from "@/shared/http/client";

export type SaveType = "blog" | "food";

export interface SaveRow {
  _id: string;
  type: SaveType;
  itemId: string;
  name: string;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  resource: any | null;       // narrow at usage site; see types.ts
  resourceDeleted: boolean;
}

export interface SavesListResponse {
  success: true;
  message: string;
  data: SaveRow[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}

export interface SavesQuery {
  type?: SaveType;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

const buildQs = (q: SavesQuery) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) p.set(k, String(v));
  });
  return p.toString();
};

export const savesApi = {
  list(q: SavesQuery, token: string) {
    return api<SavesListResponse>(`/saves?${buildQs(q)}`, { token });
  },
  counts(token: string) {
    return api<{ success: true; data: { blog: number; food: number; total: number } }>(
      `/saves/counts`,
      { token }
    );
  },
  save(type: SaveType, itemId: string, token: string) {
    return api<{ success: true; data: any }>(`/saves/${type}/${itemId}`, {
      method: "POST",
      token,
    });
  },
  unsave(type: SaveType, itemId: string, token: string) {
    return api<{ success: true; data: any }>(`/saves/${type}/${itemId}`, {
      method: "DELETE",
      token,
    });
  },
  isSaved(type: SaveType, itemId: string, token: string) {
    return api<{ success: true; data: { isSaved: boolean; type: SaveType; itemId: string } }>(
      `/saves/${type}/${itemId}/is-saved`,
      { token }
    );
  },
};
```

### 5.3 Hooks

```ts
// useMySaves.ts
export function useMySaves(q: SavesQuery) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["saves", "list", q],
    queryFn: () => savesApi.list(q, token!),
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// useSaveCounts.ts
export function useSaveCounts() {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["saves", "counts"],
    queryFn: () => savesApi.counts(token!),
    enabled: !!token,
    staleTime: 60_000,
  });
}

// useIsSaved.ts — for the toggle on a blog/food detail page
export function useIsSaved(type: SaveType, itemId: string) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["saves", "isSaved", type, itemId],
    queryFn: () => savesApi.isSaved(type, itemId, token!),
    enabled: !!token && !!itemId,
    staleTime: 0,                 // toggle state needs to be tight
  });
}

// useToggleSave.ts — optimistic toggle, works for any type
export function useToggleSave(type: SaveType, itemId: string) {
  const token = useAuthToken();
  const qc = useQueryClient();
  const isSavedQ = useIsSaved(type, itemId);
  const currentlySaved = !!isSavedQ.data?.data.isSaved;

  return useMutation({
    mutationFn: () =>
      currentlySaved
        ? savesApi.unsave(type, itemId, token!)
        : savesApi.save(type, itemId, token!),
    onMutate: async () => {
      // optimistic flip
      await qc.cancelQueries({ queryKey: ["saves", "isSaved", type, itemId] });
      qc.setQueryData(["saves", "isSaved", type, itemId], (old: any) => ({
        ...(old ?? { success: true }),
        data: { isSaved: !currentlySaved, type, itemId },
      }));
      return { prev: currentlySaved };
    },
    onError: (_e, _v, ctx) => {
      // rollback
      qc.setQueryData(["saves", "isSaved", type, itemId], (old: any) => ({
        ...(old ?? { success: true }),
        data: { isSaved: ctx?.prev ?? false, type, itemId },
      }));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}
```

### 5.4 The page — `app/(public)/saves/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { useMySaves } from "@/features/saves/hooks/useMySaves";
import { useSaveCounts } from "@/features/saves/hooks/useSaveCounts";
import { SavesTabs } from "@/features/saves/components/SavesTabs";
import { SavedBlogCard } from "@/features/saves/components/SavedBlogCard";
import { SavedFoodCard } from "@/features/saves/components/SavedFoodCard";

type Tab = "blog" | "food";

export default function SavesPage() {
  const [tab, setTab] = useState<Tab>("blog");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const counts = useSaveCounts();
  const list = useMySaves({
    type: tab,
    searchTerm: search || undefined,
    page,
    limit: 12,
    sort: "-createdAt",
  });

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved</h1>
      </header>

      <SavesTabs
        active={tab}
        counts={counts.data?.data}
        onChange={(t) => { setTab(t); setPage(1); }}
      />

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder={`Search saved ${tab === "blog" ? "blogs" : "foods"}…`}
        className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
      />

      {list.isLoading ? (
        <CardGridSkeleton />
      ) : (list.data?.data ?? []).length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(list.data?.data ?? []).map((row) =>
            row.type === "blog" ? (
              <SavedBlogCard key={row._id} row={row} />
            ) : (
              <SavedFoodCard key={row._id} row={row} />
            )
          )}
        </div>
      )}

      {list.data?.meta && list.data.meta.totalPage > 1 && (
        <Pagination meta={list.data.meta} page={page} onChange={setPage} />
      )}
    </div>
  );
}
```

### 5.5 `SavesTabs.tsx`

```tsx
export function SavesTabs({
  active, onChange, counts,
}: {
  active: "blog" | "food";
  onChange: (t: "blog" | "food") => void;
  counts?: { blog: number; food: number; total: number };
}) {
  const tabs = [
    { key: "blog", label: "Blogs", n: counts?.blog },
    { key: "food", label: "Foods", n: counts?.food },
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

### 5.6 `SavedBlogCard.tsx`

```tsx
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useToggleSave } from "../hooks/useToggleSave";
import type { SaveRow } from "../api/saves";

export function SavedBlogCard({ row }: { row: SaveRow }) {
  const toggle = useToggleSave("blog", row.itemId);

  if (row.resourceDeleted || !row.resource) {
    return <DeletedTombstone name={row.name} onUnsave={() => toggle.mutate()} />;
  }

  const b = row.resource as { _id: string; title: string; image: string; category: string; upvotes: number; commentsCount: number };

  return (
    <article className="rounded-lg border overflow-hidden bg-card">
      <Link href={`/blogs/${b._id}`}>
        <img src={b.image} alt="" className="w-full aspect-video object-cover" />
      </Link>
      <div className="p-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{b.category}</div>
        <Link href={`/blogs/${b._id}`} className="block font-semibold hover:underline line-clamp-2">
          {b.title}
        </Link>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>▲ {b.upvotes} · 💬 {b.commentsCount}</span>
          <button
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            className="inline-flex items-center gap-1 hover:text-rose-600"
            aria-label="Unsave"
          >
            <Trash2 size={14} /> Unsave
          </button>
        </div>
      </div>
    </article>
  );
}
```

### 5.7 `SavedFoodCard.tsx`

```tsx
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useToggleSave } from "../hooks/useToggleSave";
import type { SaveRow } from "../api/saves";

const fmtBDT = (n: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(n);

export function SavedFoodCard({ row }: { row: SaveRow }) {
  const toggle = useToggleSave("food", row.itemId);

  if (row.resourceDeleted || !row.resource) {
    return <DeletedTombstone name={row.name} onUnsave={() => toggle.mutate()} />;
  }

  const f = row.resource as { _id: string; foodName: string; foodImage: string; foodCategory: string; price: number; discountPercent: number };
  const discounted = f.discountPercent ? f.price * (1 - f.discountPercent / 100) : f.price;

  return (
    <article className="rounded-lg border overflow-hidden bg-card">
      <Link href={`/foods/${f._id}`}>
        <img src={f.foodImage} alt="" className="w-full aspect-video object-cover" />
      </Link>
      <div className="p-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{f.foodCategory}</div>
        <Link href={`/foods/${f._id}`} className="block font-semibold hover:underline line-clamp-2">
          {f.foodName}
        </Link>
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold">{fmtBDT(discounted)}</span>
            {f.discountPercent > 0 && (
              <span className="ml-2 line-through text-xs text-muted-foreground">{fmtBDT(f.price)}</span>
            )}
          </div>
          <button
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-600"
            aria-label="Unsave"
          >
            <Trash2 size={14} /> Unsave
          </button>
        </div>
      </div>
    </article>
  );
}
```

### 5.8 `SaveButton.tsx` — drop-in on blog/food cards & detail pages

```tsx
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useToggleSave } from "../hooks/useToggleSave";
import { useIsSaved } from "../hooks/useIsSaved";
import type { SaveType } from "../api/saves";

export function SaveButton({ type, itemId }: { type: SaveType; itemId: string }) {
  const q = useIsSaved(type, itemId);
  const toggle = useToggleSave(type, itemId);
  const saved = !!q.data?.data.isSaved;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle.mutate(); }}
      disabled={toggle.isPending}
      aria-pressed={saved}
      title={saved ? "Unsave" : "Save"}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
        saved ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
```

---

## 6. Invalidation rules

| Event | Invalidate |
|---|---|
| User saves anything | `["saves"]` (catches both `list` and `counts`) |
| User unsaves anything | `["saves"]` |
| Source blog/food deleted by author | `["saves"]` (the next list refetch will surface `resourceDeleted: true`) |

`qc.invalidateQueries({ queryKey: ["saves"] })` is the one-liner you'll use everywhere.

---

## 7. UX rules

1. **Default tab is "Blogs"** — likely the higher-volume category for most users. Persist the choice in `localStorage`.
2. **Empty states per tab:**
   - Blogs → "No saved blogs yet. Tap the bookmark on any blog to add it here."
   - Foods → "No saved foods yet."
3. **Tombstones** for `resourceDeleted: true` — show a muted card with the cached `name`, "This item was removed", and an Unsave button. Don't hide them silently — let the user clean up.
4. **Optimistic toggle** in `useToggleSave` — UI flips instantly, rolls back on error. Mandatory for the save button to feel right.
5. **Debounce search** by 300ms.
6. **Currency** for foods uses `Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" })`.
7. **`SaveButton`** placed on any blog/food card or detail page works with zero config — just pass `type` and `itemId`. The button handles its own state via TanStack Query.

---

## 8. Error responses

| HTTP | Cause | Message |
|---|---|---|
| 400 | Invalid `:type` in URL | `Invalid save type "x". Must be one of: blog, food.` |
| 401 | No / bad token | `You are not authorized!` |
| 404 | Blog or food doesn't exist (on save) | `Food not found` or "Blog not found" |
| 409 | Already saved | `Already saved` (treat as no-op in UI) |

The `409` is important — when a user double-clicks the save button, you'll get a `409`. **Don't show a scary error** — TanStack's mutation can swallow it and re-fetch `isSaved` to sync state. Or, easier: enforce idempotency on the client via `disabled={toggle.isPending}`.

---

## 9. Migration notes

- Old documents had `{ blog, user, name }` only — no `type`. The service has a **legacy fallback** in `unsaveItem` and `isItemSaved`: if a query by `(user, type:"blog", item)` returns nothing, it also tries `(user, blog)`. So old saves still appear under the Blogs tab in the list (they're filtered by `type === "blog"` if they have it; if missing, you may want to backfill).
- **Backfill snippet** (run once if you want a clean dataset):
  ```js
  db.saves.updateMany(
    { type: { $exists: false }, blog: { $exists: true } },
    [{ $set: { type: "blog", item: "$blog" } }]
  );
  ```
- New code paths only write `{ type, item, name }` (plus the legacy `blog` field mirrored when `type === "blog"`).

---

## 10. Endpoint cheat-sheet (print this)

| # | Method | URL | Auth | Body |
|---|--------|-----|------|------|
| 1 | GET    | `/saves?type=blog\|food&page=&limit=&searchTerm=&sort=` | USER | — |
| 2 | GET    | `/saves/counts` | USER | — |
| 3 | POST   | `/saves/:type/:itemId` | USER | — |
| 4 | DELETE | `/saves/:type/:itemId` | USER | — |
| 5 | GET    | `/saves/:type/:itemId/is-saved` | USER | — |

That's the whole thing. One generic save model, two tabs on the frontend, one button component, optimistic toggles everywhere.
