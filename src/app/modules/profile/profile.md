# Profile Page — Frontend Integration Guide

A single Profile page powered by the new `/api/v1/profile/*` endpoints. The layout mirrors the Instagram-style mock provided by the product owner: avatar + identity header on the left, stats/highlights/recommendations on the right, then a tabbed content grid below.

All endpoints require `Authorization: Bearer <accessToken>`.
Base URL: `/api/v1/profile`

---

## 1. Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/profile/me` | Full profile of the logged-in user (user + stats + highlights + recommendations). Use for the *own* profile page. |
| `GET` | `/profile/me/stats` | Counts only — cheaper for header refresh. |
| `GET` | `/profile/me/content/:tab` | Paginated content for one tab (`blogs` / `saved` / `orders` / `comments`). |
| `PATCH` | `/profile/me` | Update editable profile fields. Accepts `multipart/form-data` (for a new avatar via `photo` field) **or** plain JSON. |
| `PATCH` | `/profile/me/preferences` | Atomic add/remove/replace on any preference array (cuisines, restaurants, diets, meal times, payment methods). |
| `GET` | `/profile/:userId` | Public-ish view of any other user (same shape as `/me`). |
| `GET` | `/profile/:userId/stats` | Stats for any user. |
| `GET` | `/profile/:userId/content/:tab` | Tab content for any user. |

### Tabs
`blogs` · `saved` · `orders` · `comments`

### Query params for `/content/:tab`
- `page` (default `1`)
- `limit` (default `12`, max `50`)
- `status` — optional filter, applies to `blogs` (`pending`/`approved`) and `orders` (`pending`/`confirmed`/`canceled`)

---

## 2. Response shape — `GET /profile/me`

```jsonc
{
  "success": true,
  "message": "My profile retrieved successfully",
  "data": {
    "user": {
      "_id": "…",
      "name": "Alex Photographe",
      "email": "alex@…",
      "photo": "https://…",            // avatar URL
      "bio": "Food enthusiast …",
      "role": "USER" | "ADMIN",
      "status": "ACTIVE" | "BLOCKED",
      "location": "Dhaka, Bangladesh",
      "contactNumber": "+88017…",
      "socialMedia": { "instagram": "", "facebook": "", "twitter": "" },
      "diningFrequency": "Rarely" | "Occasionally" | "Frequently",
      "cuisinePreferences": ["Italian", "Japanese"],
      "favoriteRestaurants": ["Sushi Tei"],
      "dietaryRestrictions": ["Vegetarian"],
      "preferredMealTimes": ["Lunch", "Dinner"],
      "paymentMethods": ["Cash", "Digital Wallet"],
      "createdAt": "2026-05-18T17:34:19.766Z"
    },
    "stats": {
      "blogsCount": 0,
      "approvedBlogsCount": 0,
      "pendingBlogsCount": 0,
      "savedCount": 0,
      "ordersCount": 0,
      "commentsCount": 0,
      "totalUpvotesReceived": 0
    },
    "highlights": {                     // drives the "Storys" circles row
      "cuisinePreferences": [],
      "dietaryRestrictions": [],
      "preferredMealTimes": []
    },
    "recommendations": [                // drives the right-side "Recommandations" panel
      { "_id": "…", "name": "Shakil", "photo": "https://…", "bio": "…" }
    ]
  }
}
```

---

## 3. UI → API mapping (matches the mock)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [avatar]   Alex Photographe ✓                STORYS         RECOMMANDATIONS│
│             {role label}                      ◯ ◯ ◯ ◯       [user] [user]  │
│             Followed by … + N others          (highlights)   [user] [user]  │
│             {bio}                                                           │
│             {website / social links}                                        │
├────────────────────────────────────────────────────────────────────────────┤
│   ▼ PUBLICATIONS   |   SAVED   |   ORDERS   |   COMMENTS                    │
├────────────────────────────────────────────────────────────────────────────┤
│   [grid of cards from /profile/me/content/:tab]                             │
└────────────────────────────────────────────────────────────────────────────┘
```

| Mock section | Source |
|---|---|
| Avatar | `user.photo` |
| Display name + verified badge | `user.name` (badge if `user.role === "ADMIN"`) |
| Sub-title under name (e.g. "Photographe Freelance") | `user.role` + `user.location` joined |
| "Followed by … and N others" line | `stats.totalUpvotesReceived` upvotes, `stats.commentsCount` comments — re-use as social proof line |
| Bio paragraph | `user.bio` |
| Bio link (e.g. www.malt.fr/…) | `user.socialMedia.instagram/facebook/twitter` — show whichever is non-empty |
| `STORYS` circle row | `highlights.cuisinePreferences` + `highlights.dietaryRestrictions` + `highlights.preferredMealTimes` (render each chip as a circle with the first letter; "+ Nouveau" opens the preferences editor) |
| `RECOMMANDATIONS` 2×2 grid | `recommendations` (max 4 entries) |
| Tab counts | `stats.blogsCount` / `savedCount` / `ordersCount` / `commentsCount` |
| Grid cards | `/profile/me/content/:tab → items[]` |
| Message button | `user._id` → existing chat/PM flow |

### Tab card mapping

- **blogs** — each item is a `Blog`:
  `image`, `title`, `category`, `status` (badge), `upvotes`, `downvotes`, `commentsCount`.
- **saved** — each item has `blog` populated:
  use `item.blog.image`, `item.blog.title`, `item.blog.status`. Click navigates to the blog.
- **orders** — each item has `food` populated:
  `item.food.image`, `item.food.name`, `item.quantity`, `item.totalPrice`, `item.status`, `item.paymentStatus`.
- **comments** — `item.comment`, optional `item.image`, and `item.blog.title`/`item.blog.image` for context.

All four tabs return `{ items, meta: { page, limit, total } }` so the same pagination component works everywhere.

---

## 4. Editing the profile

The edit panel (opened from the gear/edit button next to "Message") should call **one** of:

### a) `PATCH /profile/me` — full form save

- Use `multipart/form-data` if the user picked a new avatar, with `photo` as the file field.
- Otherwise plain JSON is fine.
- Sendable fields (all optional, all writable from the profile page):
  ```ts
  {
    name?: string;
    bio?: string;                                  // max 500 chars
    location?: string;
    contactNumber?: string;
    cuisinePreferences?: string[];
    favoriteRestaurants?: string[];
    dietaryRestrictions?: string[];
    preferredMealTimes?: ("Breakfast"|"Lunch"|"Dinner")[];
    paymentMethods?: ("Cash"|"Credit Card"|"Digital Wallet")[];
    diningFrequency?: "Occasionally"|"Frequently"|"Rarely";
    socialMedia?: { instagram?: string; facebook?: string; twitter?: string };
  }
  ```
- Fields not in the body are left untouched. Send an empty array `[]` to clear a preference list.
- `email`, `role`, `status`, `password`, `isDeleted` are **rejected silently** here — the profile route refuses to mutate them. Use the dedicated admin endpoint for role/status changes.

### b) `PATCH /profile/me/preferences` — quick chip add/remove

Use this for the "+" buttons inside the Storys row and the chip pickers — it avoids resending the whole form.

```json
{
  "field": "cuisinePreferences" | "favoriteRestaurants" | "dietaryRestrictions" | "preferredMealTimes" | "paymentMethods",
  "action": "add" | "remove" | "replace",
  "values": ["Italian", "Thai"]
}
```

`add` uses `$addToSet` (idempotent), `remove` uses `$pull`, `replace` overwrites the array.

Both PATCH endpoints return the updated user document — re-hydrate the page from it.

---

## 5. Recommended frontend structure

```
/profile
  ├── ProfilePage.tsx           // fetches /profile/me once, owns tab state
  ├── components/
  │     ├── ProfileHeader.tsx       // avatar, name, role badge, bio, message btn
  │     ├── HighlightsRow.tsx       // "Storys" — chips from `highlights`
  │     ├── RecommendationsPanel.tsx
  │     ├── ProfileTabs.tsx         // 4 tabs, fires onChange(tab)
  │     ├── ProfileContentGrid.tsx  // fetches /content/:tab, paginated
  │     ├── EditProfileDialog.tsx   // PATCH /profile/me
  │     └── PreferenceEditor.tsx    // PATCH /profile/me/preferences
```

Caching tips:
- Keep `/profile/me` response in a single store/atom; mutating endpoints return the new user — merge it back rather than refetching.
- `/me/content/:tab` is the only request that should refire on tab change or pagination.
- On a successful `PATCH /me`, also invalidate the current tab if `bio`/`photo`/`name` is shown in any card.

---

## 6. Auth & error behaviour

- All endpoints return `401` if the token is missing/invalid.
- `400` for invalid `userId`, invalid tab, or zod validation failure (response includes `errorSources[]`).
- `404` if the target user is soft-deleted.
- Empty results return `items: []` with valid `meta` — never a 404.
- Updating someone else's profile is impossible: the `/me` routes derive the user id from the JWT, and there is no `PATCH /profile/:userId`.

---

## 7. cURL quick reference

```bash
TOKEN="..."

# Overview
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/profile/me

# Tab content
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/v1/profile/me/content/blogs?page=1&limit=12&status=approved"

# Edit (JSON)
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"bio":"hi","cuisinePreferences":["Italian"]}' \
  http://localhost:5000/api/v1/profile/me

# Edit (with avatar)
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/path/to/avatar.jpg" \
  -F "bio=hi" \
  http://localhost:5000/api/v1/profile/me

# Quick chip toggle
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"field":"cuisinePreferences","action":"add","values":["Indian","Mexican"]}' \
  http://localhost:5000/api/v1/profile/me/preferences

# View another user's profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/profile/<userId>
```
