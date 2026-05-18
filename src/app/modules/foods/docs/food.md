# Food API – Client Integration Guide

Base URL: `{API_BASE_URL}/api/v1/foods`
(e.g. `http://localhost:5000/api/v1/foods` or your deployed origin.)

All endpoints return a consistent envelope:

```ts
type ApiResponse<T> = {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  meta?: { total: number; page: number; limit: number };
};
```

Errors use the same envelope with `success: false` and an `errorSources` array (Zod / app errors).

---

## Auth

- `Authorization: Bearer <accessToken>` header.
- Roles used: `ADMIN`, `USER`.
- Public endpoints listed below do not need a token.

---

## Food entity (shape returned to client)

```ts
type Review = {
  customer_name: string;
  rating: number;        // 0–5
  comment: string;
  date: string;          // ISO or display string the client supplied
};

type Food = {
  _id: string;
  foodName: string;
  status: string;                 // default "available"
  foodImage: string;              // Cloudinary URL
  foodImagePublicId?: string;     // internal; safe to ignore on client
  foodCategory: string;
  price: number;
  discountPercent: number;        // 0–100, default 0
  orders: number;                 // default 0
  quantity: number;
  made_by: string;
  food_origin: string;
  description: string;
  isVeg: boolean;
  isSpicy: boolean;
  isGlutenFree: boolean;
  tags: string[];
  preparationTime: number;        // minutes, default 15
  reviews: Review[];
  averageRating: number;          // 0–5, auto-computed on save
  cuisine: string;
  popularity: number;
  bestseller: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

## Endpoints

### 1. Create food — `POST /create-food`  (Admin)

- Auth: `ADMIN`
- Content-Type: `multipart/form-data`
- Image upload field name: **`file`** (single image, optional but recommended — server stores it on Cloudinary).
- All non-file fields go inside a single multipart field named **`data`** as a JSON string (server uses `parseBody` middleware that does `req.body = JSON.parse(req.body.data)`).

`data` JSON shape (note: numeric fields are sent as strings because Zod validates the multipart string form):

```ts
{
  foodName: string;
  status?: string;
  foodCategory: string;
  price: string;              // positive number as string, e.g. "12.50"
  discountPercent?: string;   // "0".."100"
  quantity: string;           // non-negative integer as string
  made_by: string;
  food_origin: string;
  description: string;
  isVeg?: boolean;
  isSpicy?: boolean;
  isGlutenFree?: boolean;
  tags?: string[];
  preparationTime?: string;   // minutes as string
  cuisine?: string;
  bestseller?: boolean;
}
```

Client example (browser):

```ts
const fd = new FormData();
fd.append("file", imageFile);                 // optional
fd.append("data", JSON.stringify(payload));   // required

await fetch(`${API}/foods/create-food`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type
  body: fd,
});
```

Response: `{ success, message, data: { createdFood: Food[] } }`
(`createdFood` is an array because the server uses `Model.create([payload])`.)

---

### 2. List all foods — `GET /`  (Public)

Supports rich filtering, pagination, sorting, partial selection, and text search.

Query params:

| Param            | Type     | Notes |
|------------------|----------|-------|
| `searchTerm`     | string   | regex (case-insensitive) over `foodName`, `description`, `foodCategory`, `tags` |
| `page`           | number   | default `1` |
| `limit`          | number   | default `10` |
| `sort`           | string   | comma list, prefix `-` for desc. Default `-createdAt`. e.g. `-averageRating,price` |
| `fields`         | string   | comma list of fields to project, e.g. `foodName,price,foodImage` |
| `isVeg`          | `"true"`/`"false"` | |
| `isSpicy`        | `"true"`/`"false"` | |
| `isGlutenFree`   | `"true"`/`"false"` | |
| `bestseller`     | `"true"`/`"false"` | |
| `minRating`      | number (0–5) | filters `averageRating >= minRating` |
| `minPrice`       | number   | |
| `maxPrice`       | number   | |
| `maxPrepTime`    | number   | `preparationTime <= maxPrepTime` |
| `tags`           | string   | comma list, matches any (`$in`) |
| `hasDiscount`    | `"true"` | filters `discountPercent > 0` |
| `inStock`        | `"true"` | filters `quantity > 0` |
| `cuisine`        | string   | exact match |
| `status`         | string   | exact match, e.g. `available` |
| `foodCategory`   | string   | exact match (works via generic filter) |

Response:

```ts
{
  success: true,
  message: "retrieved all foods successfully",
  data: Food[],
  meta: { total: number, page: number, limit: number }
}
```

---

### 3. Top-selling foods — `GET /top-selling-food`  (Public)

Same query options as listing. Currently the controller calls the same service, so treat the response as:

```ts
{
  success: true,
  data: {
    data: Food[],
    meta: { total, page, limit }
  }
}
```

Tip: pass `sort=-orders,-averageRating&limit=8` to get a real top-selling list.

---

### 4. Get single food (with related) — `GET /:foodId`  (Public)

Path param: `foodId` = MongoDB ObjectId.

Response:

```ts
{
  success: true,
  data: {
    food: Food | null,
    relatedFoods: Food[],     // up to 6, by category/price/tags/cuisine/isVeg
    message: "All related foods" | "Top selling foods" | ""
  }
}
```

If `food` is `null`, the resource was not found — show a 404 UI.

---

### 5. Update food — `PATCH /:foodId`  (Admin)

- Auth: `ADMIN`
- Content-Type: `multipart/form-data`
- Same shape as create: optional `file`, plus `data` = JSON-stringified partial payload.
- All fields optional; only send what's changing.
- Extra optional updatable fields beyond create: `foodImage` (URL string), `orders` (string), `reviews` (Review[]).

Response:

```ts
{
  success: true,
  data: {
    updatedFoodData: Food | null,
    img: string                 // new image URL or ""
  }
}
```

Status code returned is `201`.

---

### 6. Delete food — `DELETE /:foodId`  (Admin)

Auth: `ADMIN`. No body.

Response:

```ts
{ success: true, data: { deletedFood: Food | null } }
```

Server also deletes the Cloudinary asset.

---

### 7. Add a review — `POST /:foodId/review`  (Authenticated: USER or ADMIN)

Content-Type: `application/json`.

Body:

```ts
{
  customer_name: string;   // min 1
  rating: number;          // 0–5
  comment: string;         // min 1
  date: string;            // free-form string, e.g. ISO date
}
```

Response: the full updated `Food` (with the new review pushed and `averageRating` recomputed).

---

## Common gotchas for the frontend

1. **Always send create/update via FormData**, never JSON, because of the `parseBody` middleware + multer. The non-file payload must be a single field `data = JSON.stringify(...)`.
2. **Numeric fields on create/update are validated as strings** (`"12.50"` not `12.50`). Cast with `String(value)` before appending.
3. **Booleans** (`isVeg`, etc.) inside the JSON `data` field are real booleans — keep them as `true`/`false` in the object you stringify.
4. Pagination meta lives at the response root `meta`, not inside `data`.
5. The list endpoint default sort is `-createdAt`. Override via `sort`.
6. The `top-selling-food` endpoint currently double-wraps data (`data.data`, `data.meta`). Handle both shapes defensively or normalize in the client.
