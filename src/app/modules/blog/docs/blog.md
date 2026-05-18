# Blog API – Client Integration Guide

Base URL: `{API_BASE_URL}/api/v1/blogs`

All endpoints return the standard envelope:

```ts
type ApiResponse<T> = {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  meta?: { total: number; page: number; limit: number };
};
```

> ⚠️ The current `blog.routes.ts` does **not** apply `auth(...)` middleware on create/update/delete. Treat these as protected on the client UI anyway (only logged-in users should see these actions), since the create endpoint requires an existing `author.user` ObjectId.

---

## Blog entity

```ts
type Blog = {
  _id: string;
  title: string;
  category: string;
  description: string;
  instructions: string[];
  tags: string[];
  image: string;                     // Cloudinary URL
  imagePublicId?: string;            // internal
  author: {
    user: string | PopulatedUser;    // ObjectId, or populated User on GET /
    name: string;
  };
  status: "pending" | "approved" | "test-approved";   // default "pending"
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
};
```

---

## Endpoints

### 1. Create blog — `POST /create`

- Content-Type: `multipart/form-data`
- File field: **`file`** (image, required by schema — server marks `image` as required).
- All other fields go in a single multipart field **`data`** as a JSON string (server uses `parseBody`).

`data` JSON shape:

```ts
{
  title: string;
  category: string;
  tags: string[];
  description: string;
  instructions: string[];
  author: {
    user: string;     // MongoDB ObjectId of the logged-in user
    name: string;     // display name
  };
}
```

Client example:

```ts
const fd = new FormData();
fd.append("file", imageFile);
fd.append("data", JSON.stringify({
  title, category, tags, description, instructions,
  author: { user: currentUser._id, name: currentUser.name },
}));

await fetch(`${API}/blogs/create`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: fd,
});
```

Notes:
- Server verifies the `author.user` exists; will return 404 if not.
- Server also writes an Analytics record automatically — no extra call needed.
- Response: `{ success: true, statusCode: 201, data: Blog[] }` (array, because `Model.create([payload])`).

---

### 2. List blogs — `GET /`

Query params:

| Param        | Type   | Notes |
|--------------|--------|-------|
| `searchTerm` | string | regex search over `title`, `category` |
| `user`       | string (ObjectId) | filter to a single author. Server rewrites to `author.user`. |
| `category`   | string | exact match |
| `status`     | `"pending" \| "approved" \| "test-approved"` | exact match |
| `tags`       | string | exact match (single tag — generic filter, not `$in`) |
| `sort`       | string | comma list, prefix `-` for desc. Default `-createdAt`. |
| `page`       | number | default `1` |
| `limit`      | number | default `10` |

Author is **populated** (`.populate("author.user")`), so on this endpoint `author.user` is the full User document, not just an ID.

Response:

```ts
{
  success: true,
  data: Blog[],   // with populated author.user
  meta: { total, page, limit }
}
```

---

### 3. Get blog by id — `GET /:id`

Path param: `id` = ObjectId.
Response: `{ success: true, data: Blog }` (no population — `author.user` is the raw ObjectId string here).
Throws `"Blog not found"` if missing.

---

### 4. Update blog — `PATCH /:id`

- Content-Type: `application/json` (this route **does not** use multer / `parseBody`, so send plain JSON).
- All fields optional:

```ts
{
  title?: string;
  category?: string;
  tags?: string[];
  description?: string;
  content?: string;
  status?: "pending" | "approved" | "test-approved";
}
```

> Image cannot be changed via this endpoint as currently wired — only text fields. To change the image you would need to delete + recreate, or extend the route to use multer.

Response: `{ success: true, data: Blog }` (updated doc).

---

### 5. Delete blog — `DELETE /:id`

No body. Response: `{ success: true, data: {} }`.
Server removes the Cloudinary image too.

---

## Frontend gotchas

1. **Create uses multipart** (`file` + `data` JSON string). Update uses **plain JSON**. Don't accidentally send FormData to PATCH.
2. **`author.user` is sometimes an ObjectId string, sometimes a populated User** — depends on the endpoint. List endpoint populates; single-get does not. Type your client model as a union and narrow at render time.
3. **The create endpoint is technically unauthenticated server-side** today. Still gate it behind your auth UI; the server validates the `author.user` exists, but it does not verify it's the *requester*. Treat fixing this as a known follow-up.
4. **Status workflow:** new blogs start as `"pending"`. If your UI needs to show only public blogs, filter `status=approved` on the list query.
5. Meta pagination lives at the response root `meta`, identical to the Food API.
6. Search is regex on `title` + `category` only — descriptions/tags are not searchable via this endpoint. Use the global search endpoint (see [search.md](../../search/docs/search.md)) if you need cross-field search.
