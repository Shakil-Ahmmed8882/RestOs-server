# Food Sidebar Filters — Frontend Integration Guide

This document describes the filter parameters supported by the **Get All Foods** endpoint and the **Filter Options** endpoint that powers the sidebar UI.

All filters are **optional**. Sending no filters returns all foods (paginated). Combining filters is allowed and they are **AND-ed** together. If a combination yields zero matches, the API returns an empty list with `meta.total = 0` — the frontend should render an empty state and let the user clear filters.

---

## 1. Endpoints

### 1.1 Get all foods (with filters)

```
GET /api/v1/foods
```

Returns the paginated, filtered list.

**Response shape**

```json
{
  "success": true,
  "message": "retrieved all foods successfully",
  "data": [ /* Food[] */ ],
  "meta": { "total": 123, "page": 1, "limit": 10 }
}
```

### 1.2 Get sidebar filter options

```
GET /api/v1/foods/filter-options
```

Use this once when the sidebar mounts to populate dropdowns / chips with the values that actually exist in the database (instead of hard-coding them).

**Response shape**

```json
{
  "success": true,
  "message": "Filter options retrieved successfully",
  "data": {
    "categories": ["Burger", "Pizza", "Drinks", "..."],
    "cuisines":   ["Italian", "Indian", "..."],
    "tags":       ["spicy", "vegan", "healthy", "..."],
    "price":      { "min": 50, "max": 1200 },
    "dietary":    ["isVeg", "isSpicy", "isGlutenFree"],
    "availability": ["inStock", "hasDiscount", "bestseller"]
  }
}
```

---

## 2. Sidebar Filter Groups

There are **6 filter groups** designed for the sidebar. Each group is independent and optional.

### Group 1 — Category

Single-select dropdown or chip group. Source the options from `filter-options.categories`.

| UI control | Query param | Type   | Example          |
| ---------- | ----------- | ------ | ---------------- |
| Dropdown   | `foodCategory` | string | `?foodCategory=Burger` |

### Group 2 — Cuisine

Single-select dropdown. Source from `filter-options.cuisines`.

| UI control | Query param | Type   | Example             |
| ---------- | ----------- | ------ | ------------------- |
| Dropdown   | `cuisine`   | string | `?cuisine=Italian`  |

### Group 3 — Price Range

Dual slider. Use `filter-options.price.min` / `.max` as the slider bounds.

| UI control | Query param | Type   | Example                       |
| ---------- | ----------- | ------ | ----------------------------- |
| Slider min | `minPrice`  | number | `?minPrice=100`               |
| Slider max | `maxPrice`  | number | `?minPrice=100&maxPrice=500`  |

Either bound may be omitted.

### Group 4 — Dietary Preferences

Toggle/checkbox group. **Only send a parameter when the user turns it ON.** Omitting the param means "don't filter on this".

| UI control | Query param     | Type    | Example                |
| ---------- | --------------- | ------- | ---------------------- |
| Checkbox   | `isVeg`         | boolean | `?isVeg=true`          |
| Checkbox   | `isSpicy`       | boolean | `?isSpicy=true`        |
| Checkbox   | `isGlutenFree`  | boolean | `?isGlutenFree=true`   |

### Group 5 — Availability & Offers

Toggle group, same rules as Group 4.

| UI control | Query param   | Type    | Description                                | Example              |
| ---------- | ------------- | ------- | ------------------------------------------ | -------------------- |
| Toggle     | `inStock`     | boolean | Hide items with `quantity = 0`             | `?inStock=true`      |
| Toggle     | `hasDiscount` | boolean | Only foods with `discountPercent > 0`      | `?hasDiscount=true`  |
| Toggle     | `bestseller`  | boolean | Only items flagged as bestseller           | `?bestseller=true`   |

### Group 6 — Rating & Prep Time

Two small numeric controls.

| UI control     | Query param    | Type   | Description                            | Example              |
| -------------- | -------------- | ------ | -------------------------------------- | -------------------- |
| Star picker    | `minRating`    | number (0–5) | Show foods with rating ≥ value   | `?minRating=4`       |
| "Under X min"  | `maxPrepTime`  | number (minutes) | Show foods cookable within X | `?maxPrepTime=20`    |

---

## 3. Bonus Parameters (not in the 6 sidebar groups, still supported)

These are useful from search bars / sort dropdowns / tag chips, not the main sidebar:

| Query param   | Type     | Notes                                                            |
| ------------- | -------- | ---------------------------------------------------------------- |
| `searchTerm`  | string   | Full-text-ish search on `foodName`, `description`, `foodCategory`, `tags` |
| `tags`        | string   | Comma-separated: `?tags=spicy,vegan` (matches if ANY tag matches) |
| `status`      | string   | e.g. `available` / `unavailable`                                 |
| `sort`        | string   | Comma-separated Mongo sort, default `-createdAt`. e.g. `-averageRating,price` |
| `page`        | number   | Default `1`                                                      |
| `limit`       | number   | Default `10`                                                     |
| `fields`      | string   | Comma-separated projection, e.g. `?fields=foodName,price,foodImage` |

---

## 4. Full Example Request

A user picks: category **Pizza**, vegetarian, under ₹500, rating ≥ 4, page 2:

```
GET /api/v1/foods?foodCategory=Pizza&isVeg=true&maxPrice=500&minRating=4&page=2&limit=12
```

---

## 5. Frontend Implementation Notes

1. **Bootstrap once:** call `GET /foods/filter-options` on sidebar mount and cache it (e.g. React Query with a long stale time). It rarely changes.
2. **Build the query string from active filters only.** Do **not** send `isVeg=false` — omit the param. The backend treats "missing" as "no filter" and "false" as a real filter for unchecked items, which is almost never what the user wants.
3. **Debounce** the price-range slider (~300 ms) so dragging doesn't fire a request per pixel.
4. **Sync filter state to the URL** (query string) so the sidebar is shareable / back-button friendly.
5. **Empty state:** when `meta.total === 0`, show a "No foods match your filters" view with a "Clear filters" button rather than a blank grid.
6. **Reset button:** clearing filters = remove all params and refetch `GET /foods`.
7. **Loading skeletons** while the request is in flight; do **not** clear the previous result list until the new one arrives — it feels janky.

---

## 6. Quick Reference — All Filter Query Params

```
foodCategory, cuisine,
minPrice, maxPrice,
isVeg, isSpicy, isGlutenFree,
inStock, hasDiscount, bestseller,
minRating, maxPrepTime,
tags, status, searchTerm,
sort, page, limit, fields
```
