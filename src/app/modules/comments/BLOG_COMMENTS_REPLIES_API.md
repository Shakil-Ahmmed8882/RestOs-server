# Blog, Comments & Replies — Frontend Integration Guide

> Hand this file to your frontend AI agent (e.g. Claude Code) as the single source of truth for implementing **Blog**, **Comments**, and **Replies** features. It contains every endpoint, method, URL, auth requirement, request payload, validation rules, and expected response shape.

---

## 1. Base & Conventions

- **API Base URL:** `{{API_BASE_URL}}/api/v1`
  - Example (local): `http://localhost:5000/api/v1`
  - Example (prod): `https://your-domain.com/api/v1`
- **Content-Type:** `application/json` for all JSON endpoints. Use `multipart/form-data` only for blog creation (image upload).
- **Authentication:** Bearer JWT in the `Authorization` header.
  ```
  Authorization: Bearer <accessToken>
  ```
- **Roles:** `USER`, `ADMIN`. Some endpoints restrict by role — see each section.
- **Standard Response Envelope** (returned by `sendResponse`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Human-readable message",
    "meta": { "page": 1, "limit": 10, "total": 100, "totalPage": 10 },
    "data": { /* payload */ }
  }
  ```
  `meta` is only present on paginated list endpoints (currently `GET /blogs`).
- **Error Response Envelope:**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Validation error / Not found / etc.",
    "errorSources": [{ "path": "body.title", "message": "Blog title is required" }],
    "stack": null
  }
  ```

---

## 2. Data Models

### 2.0 UserPopulated (returned inside comments & replies)

Whenever a **Comment** or **Reply** is returned by the API (create, update, list, get-by-blog, add-reply, update-reply, delete-reply), the `user` field is **populated** — it is an object, not a string ID. The frontend should rely on this for rendering author name, avatar, etc., and for reconciling optimistic UI.

```ts
interface UserPopulated {
  _id: string;
  name: string;          // e.g. "Shakil Ahmmed"
  email: string;
  photo: string;         // avatar URL
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
  // Sensitive fields like `password` are NEVER included.
}
```

> The server always selects the safe subset above when populating. Treat `comment.user` / `reply.user` as `UserPopulated`, never as a string.

### 2.1 Blog
```ts
interface Blog {
  _id: string;
  title: string;
  category: string;
  description: string;
  instructions: string[];     // array of step strings
  tags: string[];
  image: string;              // Cloudinary URL (server-set on upload)
  imagePublicId?: string | null;
  author: {
    user: string;             // ObjectId of the user
    name: string;
  };
  status: "pending" | "approved" | "test-approved";
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  createdAt: string;          // ISO date
  updatedAt: string;          // ISO date
}
```

### 2.2 Comment
```ts
interface Comment {
  _id: string;
  blog: string;                  // Blog ObjectId
  user: UserPopulated;           // ✅ always populated on responses
  comment: string;
  image?: string | null;         // Cloudinary URL (optional — user-uploaded image)
  imagePublicId?: string | null; // Cloudinary public_id (server-managed)
  replies: Reply[];              // embedded; each reply.user is also populated
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Reply (embedded inside Comment.replies)
```ts
interface Reply {
  _id: string;
  user: UserPopulated;        // ✅ always populated on responses
  comment: string;            // the reply text
  createdAt: string;
}
```

### 2.4 Example — fully populated comment payload
This is the exact shape the server returns from any comment/reply endpoint:

```json
{
  "_id": "665f...c0a1",
  "blog": "665f0c1a2b3c4d5e6f7a8b9c",
  "comment": "Looks delicious!",
  "image": "https://res.cloudinary.com/.../comments/abc.jpg",
  "imagePublicId": "comments/abc",
  "user": {
    "_id": "665fdeadbeef0001",
    "name": "Shakil Ahmmed",
    "email": "shakil@example.com",
    "photo": "https://res.cloudinary.com/.../users/shakil.jpg",
    "role": "USER",
    "status": "ACTIVE"
  },
  "replies": [
    {
      "_id": "665f...r1",
      "comment": "Thanks!",
      "createdAt": "2026-05-18T10:05:00.000Z",
      "user": {
        "_id": "665fdeadbeef0002",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "photo": "https://res.cloudinary.com/.../users/jane.jpg",
        "role": "USER",
        "status": "ACTIVE"
      }
    }
  ],
  "createdAt": "2026-05-18T10:00:00.000Z",
  "updatedAt": "2026-05-18T10:00:00.000Z"
}
```

---

## 3. Blog API — `/blogs`

### 3.1 Create Blog
- **Method:** `POST`
- **URL:** `/blogs/create`
- **Auth:** ⚠️ Route file does NOT apply `auth()` — but the controller reads `req.user` indirectly via the author field in the body. Send a Bearer token to be safe.
- **Content-Type:** `multipart/form-data`
- **Form fields:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | `file` | File | ✅ | The blog cover image. Field name **must** be `file`. |
  | `data` | string (JSON) | ✅ | A JSON-stringified object matching the schema below. `parseBody` middleware parses `req.body.data` into `req.body`. |

- **`data` JSON shape (validated by Zod):**
  ```json
  {
    "title": "How to make pasta",
    "category": "Italian",
    "tags": ["pasta", "italian", "dinner"],
    "description": "A short description...",
    "instructions": ["Boil water", "Add pasta", "Cook for 10 min"],
    "author": {
      "user": "665f0c1a2b3c4d5e6f7a8b9c",
      "name": "Jane Doe"
    }
  }
  ```
- **Validation rules:**
  - `title`, `category`, `description` — required strings
  - `tags`, `instructions` — required arrays of strings
  - `author.user`, `author.name` — required strings
- **Success Response 201:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Blog created successfully",
    "data": { /* Blog */ }
  }
  ```

**Frontend example (axios):**
```ts
const form = new FormData();
form.append("file", imageFile);
form.append("data", JSON.stringify(blogPayload));

await api.post("/blogs/create", form, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

---

### 3.2 Get All Blogs (paginated, filterable)
- **Method:** `GET`
- **URL:** `/blogs`
- **Auth:** Public.
- **Query params (all optional):**
  | Param | Type | Default | Notes |
  |---|---|---|---|
  | `page` | number | `1` | Pagination page |
  | `limit` | number | `10` | Page size |
  | `sortBy` | string | `createdAt` | Field name to sort by |
  | `sortOrder` | `"asc" \| "desc"` | `desc` | |
  | `searchTerm` | string | — | Free-text search across blog fields |
  | `category` | string | — | Filter by category |
  | `tags` | string | — | Filter by tag |
  | `status` | string | — | `pending` / `approved` / `test-approved` |

- **Success Response 200:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "All blogs retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 42, "totalPage": 5 },
    "data": [ /* Blog[] */ ]
  }
  ```

---

### 3.3 Get Single Blog by ID
- **Method:** `GET`
- **URL:** `/blogs/:id`
- **Auth:** Public.
- **Path params:** `id` — Blog ObjectId
- **Success Response 200:** `data: Blog`

---

### 3.4 Update Blog by ID
- **Method:** `PATCH`
- **URL:** `/blogs/:id`
- **Auth:** ⚠️ Route file does NOT apply `auth()` middleware. Send Bearer token for future-compat.
- **Content-Type:** `application/json`
- **Body (all fields optional):**
  ```json
  {
    "title": "Updated title",
    "category": "Italian",
    "tags": ["pasta"],
    "description": "Updated desc",
    "content": "Optional content",
    "status": "approved"
  }
  ```
- **Validation:** `status` must be one of `pending | approved | test-approved`.
- **Success Response 200:** `data: Blog` (updated)

---

### 3.5 Delete Blog by ID
- **Method:** `DELETE`
- **URL:** `/blogs/:id`
- **Auth:** ⚠️ Route file does NOT apply `auth()`. Send Bearer token for future-compat.
- **Success Response 200:**
  ```json
  { "success": true, "statusCode": 200, "message": "Blog deleted successfully", "data": {} }
  ```

---

## 4. Comments API — `/comments`

> Comments belong to a Blog. Each comment can have embedded `replies` (managed via the Replies API in §5).

### 4.1 Create Comment (supports optional image upload)
- **Method:** `POST`
- **URL:** `/comments/`
- **Auth:** `USER` or `ADMIN`
- **Content-Type:** **`multipart/form-data`** (image is optional — send multipart even when no image, OR fall back to `application/json` if no image)

#### 4.1.a With image (multipart/form-data)
- **Form fields:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | `file` | File | ❌ optional | The comment image. Field name **must** be `file`. Max one image per comment. Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. |
  | `data` | string (JSON) | ✅ | JSON-stringified body — same shape as below. The server's `parseBody` middleware parses `req.body.data` into `req.body`. |

- **`data` JSON shape (Zod-validated):**
  ```json
  {
    "blog": "665f0c1a2b3c4d5e6f7a8b9c",
    "comment": "Looks delicious! Here is mine 👇"
  }
  ```

#### 4.1.b Without image (plain JSON — backward compatible)
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "blog": "665f0c1a2b3c4d5e6f7a8b9c",
    "comment": "Looks delicious!"
  }
  ```

#### Validation
- `blog` — required, non-empty string (Blog ObjectId)
- `comment` — required, non-empty string
- `file` — optional; if present, image MIME type only, max **5 MB**.

#### Server behavior
- `user` is inferred from JWT (`req.user.userId`). Do **not** send `user` in body.
- If `file` is present, the server uploads it to Cloudinary and stores `image` (secure URL) + `imagePublicId` on the comment doc.

- **Success Response 201:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Comment is created successfully",
    "data": {
      "_id": "…",
      "blog": "665f0c1a2b3c4d5e6f7a8b9c",
      "user": "665f…",
      "comment": "Looks delicious!",
      "image": "https://res.cloudinary.com/.../comments/abc123.jpg",
      "imagePublicId": "comments/abc123",
      "replies": [],
      "createdAt": "2026-05-18T10:00:00.000Z",
      "updatedAt": "2026-05-18T10:00:00.000Z"
    }
  }
  ```

**Frontend example (axios) — with image:**
```ts
const form = new FormData();
if (imageFile) form.append("file", imageFile);
form.append(
  "data",
  JSON.stringify({ blog: blogId, comment: text })
);

await api.post("/comments/", form, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

**Frontend example — without image:**
```ts
await api.post("/comments/", { blog: blogId, comment: text });
```

---

### 4.2 Get All Comments on a Single Blog
- **Method:** `GET`
- **URL:** `/comments/:blogId`
- **Auth:** `USER` or `ADMIN`
- **Path params:** `blogId` — Blog ObjectId
- **Query params:** standard query helpers (page, limit, sortBy, sortOrder) — optional.
- **Success Response 200:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "All Comments on single post are retrieved successfully",
    "data": [ /* Comment[] with embedded replies */ ]
  }
  ```

---

### 4.3 Get All Comments (admin)
- **Method:** `GET`
- **URL:** `/comments/`
- **Auth:** `ADMIN` only
- **Query params:** standard helpers.
- **Success Response 200:** `data: Comment[]`

---

### 4.4 Update Comment by ID (supports image replace / remove)
- **Method:** `PATCH`
- **URL:** `/comments/:commentId`
- **Auth:** `USER` (only the author of the comment can update — server enforces ownership)
- **Content-Type:** `multipart/form-data` (when changing/removing image) **or** `application/json` (text-only).

#### 4.4.a Text-only update (JSON)
```json
{ "comment": "Edited comment text" }
```

#### 4.4.b Update text + replace image (multipart/form-data)
- **Form fields:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | `file` | File | ❌ | New image. If present, replaces the existing one and deletes the previous Cloudinary asset. |
  | `data` | string (JSON) | ✅ | JSON-stringified body. See shape below. |

- **`data` JSON shape (all fields optional):**
  ```json
  {
    "comment": "Edited comment text",
    "removeImage": false
  }
  ```
  - `comment` — optional new text
  - `removeImage` — optional `boolean`. When `true`, the server clears `image` / `imagePublicId` and deletes the Cloudinary asset. Ignored if a new `file` is also provided (replace wins).

#### Validation
- At least one of `comment`, `file`, or `removeImage: true` must be present.
- `file` rules same as create (image MIME, ≤5 MB).

- **Success Response 200:** `data: Comment` (updated)

**Frontend examples:**
```ts
// Text-only edit
await api.patch(`/comments/${commentId}`, { comment: newText });

// Replace image
const form = new FormData();
form.append("file", newImage);
form.append("data", JSON.stringify({ comment: newText }));
await api.patch(`/comments/${commentId}`, form, {
  headers: { "Content-Type": "multipart/form-data" },
});

// Remove image only
await api.patch(`/comments/${commentId}`, { removeImage: true });
```

---

### 4.5 Delete Comment by ID
- **Method:** `DELETE`
- **URL:** `/comments/:commentId`
- **Auth:** `USER` or `ADMIN`
  - `USER` — must own the comment
  - `ADMIN` — can delete any
- **Server behavior:** if the comment has an `imagePublicId`, the associated Cloudinary asset is also removed.
- **Success Response 200:**
  ```json
  { "success": true, "statusCode": 200, "message": "Comment is deleted successfully", "data": null }
  ```

---

## 5. Replies API — `/replies`

> Replies are stored embedded inside `Comment.replies`. All reply endpoints live under `/replies`.

### 5.1 Add Reply to a Comment
- **Method:** `POST`
- **URL:** `/replies/:commentId/reply`
- **Auth:** `USER` or `ADMIN`
- **Content-Type:** `application/json`
- **Path params:** `commentId` — Comment ObjectId
- **Body (Zod-validated):**
  ```json
  {
    "replyText": "Thanks for sharing!",
    "blogId": "665f0c1a2b3c4d5e6f7a8b9c"
  }
  ```
  - `replyText` — required string (the reply content)
  - `blogId` — required string (the Blog ObjectId the parent comment belongs to)
- **Server behavior:** `user` inferred from JWT. The new reply is pushed onto `Comment.replies`.
- **Success Response 201:** `data: Comment` (with the new reply appended)

---

### 5.2 Update a Reply
- **Method:** `PATCH`
- **URL:** `/replies/comments/:commentId/reply/:replyId`
- **Auth:** `USER` (only the reply author)
- **Content-Type:** `application/json`
- **Path params:** `commentId`, `replyId`
- **Body (same Zod schema as create — both fields required):**
  ```json
  {
    "replyText": "Updated reply text",
    "blogId": "665f0c1a2b3c4d5e6f7a8b9c"
  }
  ```
- **Success Response 200:** `data: Comment` (with the updated reply)

---

### 5.3 Delete a Reply
- **Method:** `DELETE`
- **URL:** `/replies/comments/:commentId/reply/:replyId`
- **Auth:** `USER` or `ADMIN`
  - `USER` — must own the reply
  - `ADMIN` — can delete any
- **Success Response 200:**
  ```json
  { "success": true, "statusCode": 200, "message": "Reply deleted successfully", "data": { /* Comment */ } }
  ```

---

## 6. Quick Endpoint Reference

| # | Method | URL | Auth | Body / Params |
|---|--------|-----|------|----------------|
| 1 | POST   | `/blogs/create` | (token recommended) | `multipart/form-data` — `file`, `data` (JSON) |
| 2 | GET    | `/blogs` | Public | Query: `page, limit, sortBy, sortOrder, searchTerm, category, tags, status` |
| 3 | GET    | `/blogs/:id` | Public | — |
| 4 | PATCH  | `/blogs/:id` | (token recommended) | JSON — partial Blog |
| 5 | DELETE | `/blogs/:id` | (token recommended) | — |
| 6 | POST   | `/comments/` | USER, ADMIN | `multipart` (`file` + `data` JSON) **or** JSON `{ blog, comment }` |
| 7 | GET    | `/comments/:blogId` | USER, ADMIN | — |
| 8 | GET    | `/comments/` | ADMIN | — |
| 9 | PATCH  | `/comments/:commentId` | USER (owner) | `multipart` (`file` + `data` JSON) **or** JSON `{ comment?, removeImage? }` |
| 10 | DELETE | `/comments/:commentId` | USER (owner) / ADMIN | — |
| 11 | POST   | `/replies/:commentId/reply` | USER, ADMIN | `{ replyText, blogId }` |
| 12 | PATCH  | `/replies/comments/:commentId/reply/:replyId` | USER (owner) | `{ replyText, blogId }` |
| 13 | DELETE | `/replies/comments/:commentId/reply/:replyId` | USER (owner) / ADMIN | — |

---

## 6.1 Comment Image Upload & Display — Frontend Recipe

This is the full guide for letting users attach an image to a comment and rendering it.

### A. Compose UI
- A textarea for the comment text.
- An **image picker** (`<input type="file" accept="image/*" />`) with:
  - Local preview (`URL.createObjectURL(file)`)
  - A small **"Remove"** button to clear the selection before submit
  - Client-side validation: reject if size > 5 MB or MIME not in `image/jpeg|png|webp|gif`

### B. Submitting a new comment
```ts
async function submitComment(blogId: string, text: string, image?: File | null) {
  if (!image) {
    // Plain JSON — backward compatible
    return api.post("/comments/", { blog: blogId, comment: text });
  }
  const form = new FormData();
  form.append("file", image);
  form.append("data", JSON.stringify({ blog: blogId, comment: text }));
  return api.post("/comments/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
```

### C. Editing a comment (text, replace image, or remove image)
```ts
async function editComment(
  commentId: string,
  opts: { text?: string; newImage?: File | null; removeImage?: boolean }
) {
  const { text, newImage, removeImage } = opts;

  if (newImage) {
    const form = new FormData();
    form.append("file", newImage);
    form.append("data", JSON.stringify({ comment: text }));
    return api.patch(`/comments/${commentId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.patch(`/comments/${commentId}`, {
    ...(text !== undefined && { comment: text }),
    ...(removeImage && { removeImage: true }),
  });
}
```

### D. Rendering a comment with image
```tsx
function CommentCard({ comment }: { comment: Comment }) {
  return (
    <div className="comment-card">
      <div className="comment-body">
        <p>{comment.comment}</p>
        {comment.image && (
          <a href={comment.image} target="_blank" rel="noopener noreferrer">
            <img
              src={comment.image}
              alt="comment attachment"
              loading="lazy"
              className="comment-image"
            />
          </a>
        )}
      </div>
      <CommentActions comment={comment} />
    </div>
  );
}
```

**Styling tips**
```css
.comment-image {
  max-width: 360px;
  max-height: 360px;
  border-radius: 8px;
  object-fit: cover;
  margin-top: 8px;
  cursor: zoom-in;
}
```

### E. Optimistic update flow
1. Build a temporary comment with `image: URL.createObjectURL(file)`, `_id: "temp-…"`, `pending: true`.
2. Insert it into the list immediately.
3. Fire the upload. On success, replace by `_id`. On error, remove + show toast.
4. Revoke the object URL once the real Cloudinary URL is rendered: `URL.revokeObjectURL(tempUrl)`.

### F. Lightbox (optional but recommended)
On image click, open a modal that displays the full `comment.image` URL — Cloudinary URLs are already CDN-served and safe to render directly.

---

## 6.2 Optimistic UI with Populated Responses (CRITICAL — read carefully)

**Contract:** every comment/reply endpoint returns the comment (or reply's parent comment) with `user` fully populated as a `UserPopulated` object (see §2.0). The frontend should rely on this to render author name & avatar **without doing a second lookup**.

Applies to:
- `POST /comments/` → returns the created **Comment** with populated `user`
- `PATCH /comments/:commentId` → returns the updated **Comment** with populated `user`
- `GET /comments/:blogId`, `GET /comments/` → return arrays of **Comments**, each with populated `user` (and every embedded `reply.user` populated too)
- `POST /replies/:commentId/reply` → returns the parent **Comment** with the new reply appended; both `comment.user` and the new `reply.user` are populated
- `PATCH /replies/comments/:commentId/reply/:replyId` → returns the parent **Comment** with the edited reply; populated
- `DELETE /replies/...` → returns the parent **Comment** after removal; populated

### Recommended optimistic flow

1. **Build a temp object** from what you already have in the client (current user object from your auth store).
2. **Insert it into local state** immediately so the UI feels instant.
3. **Fire the request** — the server response will already include the populated `user`.
4. **Reconcile**: replace the temp item by matching the temp `_id` (or by `optimisticId`), using the server's returned shape verbatim.
5. On error: remove the temp item, show a toast.

```ts
// Types
type Comment = {
  _id: string;
  blog: string;
  comment: string;
  image?: string | null;
  user: UserPopulated;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
  // local-only:
  _optimistic?: boolean;
  _tempId?: string;
};

async function postComment(blogId: string, text: string, image?: File | null) {
  const me = authStore.user; // already a UserPopulated-shaped object
  const tempId = `temp-${crypto.randomUUID()}`;

  // 1. Optimistic insert
  const tempComment: Comment = {
    _id: tempId,
    blog: blogId,
    comment: text,
    image: image ? URL.createObjectURL(image) : null,
    user: {
      _id: me._id,
      name: me.name,
      email: me.email,
      photo: me.photo,
      role: me.role,
      status: me.status,
    },
    replies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _optimistic: true,
    _tempId: tempId,
  };
  commentStore.prepend(tempComment);

  try {
    // 2. Send to server
    const res = image
      ? await api.post("/comments/", buildForm(blogId, text, image), {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : await api.post("/comments/", { blog: blogId, comment: text });

    const saved: Comment = res.data.data; // already has populated `user`

    // 3. Reconcile — swap temp → real
    commentStore.replaceByTempId(tempId, saved);

    // 4. Free the local preview URL
    if (tempComment.image?.startsWith("blob:")) {
      URL.revokeObjectURL(tempComment.image);
    }
  } catch (err) {
    commentStore.removeByTempId(tempId);
    toast.error("Failed to post comment");
  }
}
```

### Reply — same pattern, but the response is the **parent comment**

For replies the server returns the **entire parent Comment** with the new/edited reply included. Two ways to reconcile:

- **Easy**: replace the whole comment in your list by `_id`.
- **Granular**: find the new reply in `parentComment.replies` (it's the one matching your `_tempReplyId` — see below) and swap.

```ts
async function postReply(parentCommentId: string, blogId: string, replyText: string) {
  const me = authStore.user;
  const tempReplyId = `temp-${crypto.randomUUID()}`;

  const tempReply: Reply = {
    _id: tempReplyId,
    comment: replyText,
    createdAt: new Date().toISOString(),
    user: { _id: me._id, name: me.name, email: me.email, photo: me.photo, role: me.role, status: me.status },
  };

  // 1. Optimistic: push into the parent comment's replies
  commentStore.appendReply(parentCommentId, { ...tempReply, _optimistic: true });

  try {
    const res = await api.post(`/replies/${parentCommentId}/reply`, {
      replyText,
      blogId,
    });
    const updatedParent: Comment = res.data.data; // populated

    // 2. Easiest reconciliation — replace the whole parent comment
    commentStore.replaceById(updatedParent._id, updatedParent);
  } catch {
    commentStore.removeReply(parentCommentId, tempReplyId);
    toast.error("Failed to post reply");
  }
}
```

### Rendering — read author info straight off the populated user

```tsx
function CommentHeader({ comment }: { comment: Comment }) {
  const { user, createdAt } = comment;
  return (
    <header className="comment-header">
      <img src={user.photo} alt={user.name} className="avatar" />
      <div>
        <strong>{user.name}</strong>
        <time dateTime={createdAt}>{formatRelative(createdAt)}</time>
      </div>
    </header>
  );
}
```

### Gotchas
1. **Don't treat `user` as a string.** It's always an object on responses. If you previously stored just an ID, migrate now.
2. **Don't re-fetch the user.** The populated payload already has everything you need to render the author.
3. **Trust the server response, not your optimistic guess.** Always overwrite the temp item with the server's returned shape — `createdAt`, `_id`, and especially the `user.photo` (which may be different from what you cached) should come from the server.
4. **Pending state**: while the request is in flight, show a subtle spinner / faded style based on `_optimistic: true`. Remove the flag after reconciliation.
5. **Replies are embedded.** Updating/deleting a reply returns the **whole parent Comment** — the simplest reconciliation is to replace the entire parent in your list.

---

## 7. Frontend Implementation Notes (for the AI agent)

1. **Single API client.** Build one axios/fetch wrapper that:
   - Prepends `{{API_BASE_URL}}/api/v1`
   - Attaches `Authorization: Bearer <token>` from auth store/localStorage when present
   - Unwraps `response.data` and surfaces `errorSources` for form-level error display
2. **TypeScript types.** Generate types from §2 (Blog, Comment, Reply) and the request bodies in §3–§5. Reuse the union `BlogStatus = "pending" | "approved" | "test-approved"`.
3. **Blog create form.** Always send as `FormData` with `file` (the image) and `data` (a `JSON.stringify(...)` of the rest). Do NOT send the fields as flat form fields — the backend's `parseBody` expects `data` to be a JSON string.
4. **Comment & reply ownership UI.** Show Edit/Delete actions on a comment or reply only when:
   - `currentUser.role === "ADMIN"`, OR
   - `currentUser._id === comment.user._id` (or `reply.user._id`)
5. **Optimistic updates.** Comments and replies are good candidates for optimistic UI — the responses return the updated parent Comment so you can replace it in cache.
6. **Pagination.** Only `GET /blogs` returns `meta`. Comments list endpoints return an unpaginated array today — do not assume `meta` is present there.
7. **Auth caveat on Blog routes.** The blog `POST /create`, `PATCH /:id`, `DELETE /:id` routes do **not** currently apply `auth()` middleware on the server. Still send the Bearer token from the frontend so behavior stays correct when the server adds it.
8. **Reply route prefix is unusual.** Update/Delete reply URLs are `/replies/comments/:commentId/reply/:replyId` (note `/replies/comments/...`, not `/comments/...`). Create-reply is `/replies/:commentId/reply`. Do not collapse these into `/comments/...`.
9. **Comment image is optional.** Always handle `comment.image == null` gracefully. The field is added to support attachments — older comments will not have it.
10. **Submit `multipart` only when there is a file.** Sending an empty `FormData` for text-only comments wastes a request and forces the user to deal with `parseBody`. Keep the dual-mode (`JSON` for text-only, `multipart` for image) as shown in the recipes above.

---

## 8. cURL Smoke Tests

```bash
# Create a comment
curl -X POST {{BASE}}/api/v1/comments/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blog":"<blogId>","comment":"Nice post!"}'

# Add a reply
curl -X POST {{BASE}}/api/v1/replies/<commentId>/reply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"replyText":"Thanks!","blogId":"<blogId>"}'

# Update a reply
curl -X PATCH {{BASE}}/api/v1/replies/comments/<commentId>/reply/<replyId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"replyText":"Edited","blogId":"<blogId>"}'

# Delete a comment
curl -X DELETE {{BASE}}/api/v1/comments/<commentId> \
  -H "Authorization: Bearer $TOKEN"

# Create a comment WITH an image
curl -X POST {{BASE}}/api/v1/comments/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg" \
  -F 'data={"blog":"<blogId>","comment":"Look at my dish!"}'

# Edit a comment — replace the image
curl -X PATCH {{BASE}}/api/v1/comments/<commentId> \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/new.jpg" \
  -F 'data={"comment":"Updated caption"}'

# Edit a comment — remove the image
curl -X PATCH {{BASE}}/api/v1/comments/<commentId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"removeImage": true}'
```

---

## 9. ✅ Backend status — implemented

The image-upload behavior described in §4.1, §4.4, §4.5, §6.1, and the cURL `multipart` examples above is **live on the server** as of this commit. Implementation summary (mirrors the pattern in `blog.routes.ts`):

1. **Model** (`comment.model.ts`): add `image: { type: String, default: null }` and `imagePublicId: { type: String, default: null }` to `commentSchema`.
2. **Validation** (`comment.validation.ts`):
   - Keep `blog` + `comment` required in create.
   - In update, add optional `removeImage: z.boolean().optional()`.
3. **Route** (`comment.route.ts`):
   ```ts
   import { uploadImage } from "../media-management";
   import parseBody from "../../utils/parseBody";

   router.post(
     "/",
     auth(USER_ROLE.USER, USER_ROLE.ADMIN),
     uploadImage.single("file"),
     parseBody,
     validateRequest(createCommentValidationSchema),
     CommentController.createComment
   );

   router.patch(
     "/:commentId",
     auth(USER_ROLE.USER),
     uploadImage.single("file"),
     parseBody,
     validateRequest(updateCommentValidationSchema),
     CommentController.updateCommentById
   );
   ```
4. **Controller / Service**:
   - On create: if `req.file` present, upload to Cloudinary, persist `image` + `imagePublicId`.
   - On update: if new `req.file`, delete the old `imagePublicId` from Cloudinary and replace. If `req.body.removeImage === true`, delete and null both fields.
   - On delete: if `imagePublicId` present, delete from Cloudinary before removing the doc.
5. **Always populate `user` on returned comments/replies** (required for the optimistic-UI contract in §6.2). Apply this to **every** comment/reply response — create, update, list, get-by-blog, add-reply, update-reply, delete-reply.

   Use a single safe projection so we never leak `password` or other sensitive fields:
   ```ts
   const USER_SAFE_FIELDS = "_id name email photo role status";

   // Top-level comment author
   query.populate({ path: "user", select: USER_SAFE_FIELDS });

   // Embedded replies' authors
   query.populate({ path: "replies.user", select: USER_SAFE_FIELDS });
   ```

   For create / update / addReply etc., after the `.save()` or `.findByIdAndUpdate(...)`, re-fetch with `.populate(...)` (or chain `.populate(...).execPopulate()` on the doc) before returning. Example:
   ```ts
   const created = await Comment.create({ blog, user: userId, comment });
   const populated = await Comment.findById(created._id)
     .populate({ path: "user", select: USER_SAFE_FIELDS })
     .populate({ path: "replies.user", select: USER_SAFE_FIELDS });
   return populated;
   ```

Once those five steps land, the frontend recipe in §6.1 and the optimistic-UI flow in §6.2 work as-is — no further frontend changes needed.
