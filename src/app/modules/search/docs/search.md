# Global Search API – Client Integration Guide

Base URL: `{API_BASE_URL}/api/v1/search`

A single endpoint that searches across **Blogs**, **Foods**, and **Food Categories** in parallel and returns grouped results.

---

## Endpoint

### `GET /`  (Public, no auth)

Query params:

| Param        | Type   | Default       | Notes |
|--------------|--------|---------------|-------|
| `searchTerm` | string | `""`          | The text to search; empty string returns everything (limited by pagination). |
| `sortBy`     | string | `createdAt`   | Field used inside the aggregation pipeline. |
| `sortOrder`  | `"asc"` \| `"desc"` | `desc` | |
| `page`       | number | `1`           | |
| `limit`      | number | `10`          | Applies to each source independently. |

The search is regex-based, case-insensitive, against:
- **Blogs:** `title`, `category`
- **Foods:** `foodName`, `foodCategory`, `tags`, `description` (whatever `modelQueries` projects — treat the server result as the source of truth and display the projected fields).
- **FoodCategories:** their searchable fields (e.g. category name).

---

## Response shape

```ts
{
  success: true,
  message: "Fetch all search results successfully!!",
  statusCode: 200,
  data: [
    { source: "blogs"          | null, data: BlogLike[] },
    { source: "foods"          | null, data: FoodLike[] },
    { source: "foodCategories" | null, data: FoodCategoryLike[] }
  ],
  meta: {
    page: number,
    limit: number,
    total: number   // sum across all three sources for the current page
  }
}
```

- The order of the three buckets is **fixed**: blogs, foods, foodCategories.
- `source` is `null` when that bucket has zero results — use this as the "empty" flag rather than checking `data.length` (both work, but `source: null` is the server's contract).
- Each bucket's `data` array is the projected output of the aggregation pipeline. Treat the field set as a subset of the corresponding entity (see [food.md](../../foods/docs/food.md) and [blog.md](../../blog/docs/blog.md) for the full entity shapes).

---

## Client usage examples

### Simple search box

```ts
const qs = new URLSearchParams({
  searchTerm: term,
  page: String(page),
  limit: "10",
});

const res = await fetch(`${API}/search?${qs}`);
const json = await res.json();

const groups = json.data;                  // [{source, data}, ...]
const blogs           = groups[0].data;
const foods           = groups[1].data;
const foodCategories  = groups[2].data;
```

### Render only populated groups

```tsx
{json.data
  .filter(g => g.source !== null)
  .map(g => <SearchGroup key={g.source} title={g.source} items={g.data} />)}
```

---

## Gotchas

1. **`limit` is per source, not global.** A `limit=10` request can return up to 30 documents (10 per bucket). Plan UI rows accordingly.
2. **`meta.total` is the sum across the three sources for the current page** — it is not the global match count. Use it for "X results on this page", not for computing total pages.
3. **No auth required**, but rate-limit on the client (debounce ~250–400 ms) to avoid regex-spam on the DB.
4. **Empty `searchTerm`** is valid and returns the most recent items from each collection (still paginated).
5. Result shapes are projections; do not assume every field of the full entity is present. Always null-check before rendering.
