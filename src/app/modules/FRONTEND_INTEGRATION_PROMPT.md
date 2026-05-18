# 🚀 Restaurant Management — Frontend Integration Master Prompt

> **Paste this entire file into Claude Code (or any cloud AI) inside your Next.js frontend project.** It is a complete, self-contained brief: a senior engineer's playbook for wiring the Foods, Blog, and Global Search APIs into the existing UI with clean architecture, optimistic updates, and reusable primitives. Do not deviate from the rules. Do not invent endpoints. Do not skip a phase.

---

## 0. Companion API contracts (READ FIRST, treat as the single source of truth)

These three files contain the exact endpoint, payload, validation, response envelope, and gotchas for every API you will touch. They are **non-negotiable** — do not guess shapes; open them.

- `src/app/modules/foods/docs/food.md`
- `src/app/modules/blog/docs/blog.md`
- `src/app/modules/search/docs/search.md`

If something in this prompt seems to conflict with those docs, the docs win.

Backend mounts everything under: `{API_BASE_URL}/api/v1/{foods|blogs|search}`.

---

## 1. The mission, in one paragraph

You are wiring a restaurant management dashboard + public storefront (Next.js, App Router, TypeScript). The home, listing, and detail pages already exist as static layouts. Your job: **make them live**. Plug in the Foods/Blogs/Search APIs, add admin update + delete flows behind a single shared multi-step modal, make every mutation **optimistic** (UI updates first, server confirms after, rollback on failure), and replace the "search → 404" bug with an in-app **search modal** that groups results by source and routes the user to the right detail page on select.

The bar is "50-year-senior engineer": clean architecture, reusable primitives, zero prop drilling, predictable cache invalidation, no dead code, no half-finished states.

---

## 2. Non-negotiable architectural rules

1. **Feature-sliced folder layout** under `src/features/<feature>/` containing:
   ```
   features/
     foods/
       api/          # fetcher functions, zero React inside
       hooks/        # useFoods, useFood, useCreateFood, useUpdateFood, useDeleteFood, useAddReview
       components/   # FoodCard, FoodGrid, FoodFormFields, FoodReviewList
       schemas/      # zod schemas (mirror server validation)
       types.ts
     blogs/    ...same structure
     search/   ...same structure
   ```
   Shared things (modal, button, form primitives, query client, http client) live in `src/shared/`.

2. **Data layer: TanStack Query v5.** No `useEffect`+`fetch`. Query keys are tuples:
   - `["foods", "list", filters]`
   - `["foods", "detail", id]`
   - `["blogs", "list", filters]`
   - `["blogs", "detail", id]`
   - `["search", searchTerm, page]`
   Export a `foodKeys` / `blogKeys` factory per feature so nothing references string literals directly.

3. **HTTP client:** one `src/shared/lib/http.ts` axios (or fetch wrapper) instance. It attaches `Authorization: Bearer <token>` from your auth store, base URL from `process.env.NEXT_PUBLIC_API_BASE_URL`, and unwraps the standard envelope `{ success, data, meta, message }`. Every hook gets typed `data` + `meta` — never the raw envelope.

4. **Forms:** `react-hook-form` + `zod` + `@hookform/resolvers/zod`. The zod schema mirrors the server schema from the docs (remember: numeric food fields are validated as **strings** on the server because they come from multipart).

5. **Multipart payloads (food create/update, blog create):** always build `FormData` with **one file field `file`** and **one JSON field `data` = `JSON.stringify(payload)`**. The server's `parseBody` middleware expects exactly this. Do NOT set `Content-Type` manually — let the browser set the boundary.

6. **Optimistic mutations are mandatory** for update, delete, add-review, status toggles. Use TanStack's `onMutate` → snapshot → optimistic write → `onError` rollback → `onSettled` invalidate pattern. Never write a mutation that only invalidates after success.

7. **One shared multi-step modal** (`src/shared/components/ui/MultiStepModal.tsx`) is reused for: food update, food delete confirm, blog update, blog delete confirm, and the search experience. Build it once, drive it via a controller hook `useMultiStepModal({ steps })`. Do not create one-off modals per feature.

8. **No prop drilling for modal state.** Modal open/close + payload lives in a tiny zustand store (`src/shared/stores/modalStore.ts`) keyed by modal id, so any card anywhere can call `openModal("food.update", { foodId })`.

9. **Loading & error UX:**
   - Buttons mid-mutation: disabled, show a spinner *inside the button*, keep label text.
   - Destructive buttons mid-delete: spinner inside the red button, no layout shift.
   - Lists: skeletons that match the final card geometry, not generic spinners.
   - Empty states: real components (`<EmptyState icon title hint cta />`), never bare text.

10. **Routing for detail pages already exists** — your job is only to link to them:
    - Food detail: `/foods/[foodId]`
    - Blog detail: `/blogs/[id]`
    Food cards on home and dashboard navigate to `/foods/[foodId]` on click. Blog cards → `/blogs/[id]`. Do not rebuild the detail pages — they're built.

11. **No `any`, no `as unknown as`, no `// @ts-expect-error` without a one-line reason.** Types come from the docs.

12. **Accessibility:** modal traps focus, ESC closes, backdrop click closes (configurable), `aria-labelledby` / `aria-describedby` set. Confirmation modals do NOT close on backdrop click.

---

## 3. Implementation order — execute these phases serially

> Do **one phase at a time**. After each phase: run typecheck, run the dev server, manually verify the listed acceptance criteria, then move on. Do not start phase N+1 with phase N broken.

---

### Phase 1 — Foundation (shared primitives, no feature code yet)

**Deliverables:**
1. `src/shared/lib/http.ts` — axios instance: base URL, auth header injector, response interceptor that returns `res.data` (so callers see `{ success, data, meta }`), error interceptor that throws an `ApiError` with `status`, `message`, `errorSources`.
2. `src/shared/lib/queryClient.ts` — `QueryClient` with sensible defaults: `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`. Wrap the app in `<QueryClientProvider>`.
3. `src/shared/stores/modalStore.ts` — zustand store:
   ```ts
   type ModalState = {
     openId: string | null;
     payload: unknown;
     openModal: (id: string, payload?: unknown) => void;
     closeModal: () => void;
   };
   ```
4. `src/shared/components/ui/MultiStepModal.tsx` — headless modal (Radix Dialog or your own) with:
   - `steps: { id: string; title: string; render: (ctx) => ReactNode }[]`
   - `next() / back() / goTo(id)`
   - `data` accumulator passed to each step
   - `onComplete(data)`
   - `closeOnBackdrop?: boolean` (default true, false for confirms)
   - Focus trap, ESC handling, scroll lock, animated step transitions.
5. `src/shared/components/ui/Button.tsx` — variants (`primary | secondary | destructive | ghost`), `loading` prop that swaps icon for spinner without changing button width.
6. `src/shared/components/ui/EmptyState.tsx`, `Skeleton.tsx`, `Spinner.tsx`.
7. `src/shared/components/forms/` — `TextField`, `TextArea`, `NumberField`, `SelectField`, `TagsInput`, `SwitchField`, `ImageDropzone` (preview + remove + drag-drop + accepts a single `File`). All wired to `react-hook-form` via `useController`.
8. `src/shared/utils/buildFoodFormData.ts` and `buildBlogFormData.ts` — pure helpers that take a typed payload + optional `File` and return a `FormData` with `file` and `data` keys exactly as the server expects.

**Acceptance:** App boots, devtools shows React Query devtools, modal can be opened/closed from a throwaway test button, focus is trapped, ESC closes.

---

### Phase 2 — Foods: read paths (list + detail wiring)

**Deliverables:**
1. `features/foods/types.ts` — `Food`, `Review` types copied verbatim from `food.md`.
2. `features/foods/api/foodApi.ts`:
   - `listFoods(filters): Promise<{ data: Food[]; meta: Meta }>` → `GET /foods`
   - `getFood(id): Promise<{ food: Food | null; relatedFoods: Food[]; message: string }>` → `GET /foods/:id`
   - `getTopFoods(filters)` → `GET /foods/top-selling-food` (handle the double-wrap quirk from the doc: inspect response and normalize).
3. `features/foods/hooks/`:
   - `useFoods(filters)` — `useQuery`, key `["foods","list", filters]`.
   - `useFood(id)` — `useQuery`, enabled when `id`.
   - `useTopFoods(filters)`.
4. `features/foods/components/FoodCard.tsx` — clickable, navigates to `/foods/[foodId]`. Admin-only floating action overlay: ✏️ edit + 🗑 delete buttons, each calls `openModal("food.update", { foodId })` / `openModal("food.delete", { foodId })`. Use `useAuth()` to gate the overlay.
5. `features/foods/components/FoodGrid.tsx` — handles `isLoading` → skeleton grid, `isError` → error state with retry, empty → `<EmptyState />`.
6. **Wire home page**: replace the static food list with `<FoodGrid filters={...} />`. Replace the existing home top-selling section with `<FoodGrid />` using `useTopFoods` + a curated `sort=-orders,-averageRating&limit=8`.
7. **Wire dashboard food list page** identically, plus the filter sidebar bound to URL search params (so refresh preserves filters).

**Acceptance:** Home and dashboard load real foods. Clicking a card opens the existing detail page with real data and shows related foods. Filters in dashboard reflect in the URL and survive refresh.

---

### Phase 3 — Foods: update (optimistic, via MultiStepModal)

**Deliverables:**
1. Register modal id `"food.update"`. Payload: `{ foodId: string }`.
2. Inside the modal renderer for this id, fetch the food via `useFood(foodId)` and **pre-populate the entire form** with current values. Show a skeleton while loading.
3. Step layout:
   - **Step 1 — Basics:** `foodName`, `foodCategory`, `cuisine`, `description`, `foodImage` (dropzone, pre-shows current image — replacing it sets a new `File`, otherwise no `file` field is sent).
   - **Step 2 — Pricing & inventory:** `price`, `discountPercent`, `quantity`, `preparationTime`, `status`.
   - **Step 3 — Attributes:** `isVeg`, `isSpicy`, `isGlutenFree`, `bestseller`, `tags` (TagsInput), `made_by`, `food_origin`.
   - **Step 4 — Review:** read-only summary of all changes, "Save changes" button.
4. `useUpdateFood`:
   ```ts
   onMutate: async ({ foodId, payload, file }) => {
     await qc.cancelQueries({ queryKey: foodKeys.detail(foodId) });
     await qc.cancelQueries({ queryKey: foodKeys.lists() });
     const prevDetail = qc.getQueryData(foodKeys.detail(foodId));
     const prevLists  = qc.getQueriesData({ queryKey: foodKeys.lists() });

     // Optimistically patch detail
     qc.setQueryData(foodKeys.detail(foodId), (old) =>
       old ? { ...old, food: { ...old.food, ...payload } } : old
     );
     // Optimistically patch every cached list
     prevLists.forEach(([key, value]) => {
       if (!value) return;
       qc.setQueryData(key, {
         ...value,
         data: value.data.map(f => f._id === foodId ? { ...f, ...payload } : f),
       });
     });
     return { prevDetail, prevLists };
   },
   onError: (_e, _v, ctx) => { /* restore from ctx */ },
   onSettled: (_d, _e, { foodId }) => {
     qc.invalidateQueries({ queryKey: foodKeys.detail(foodId) });
     qc.invalidateQueries({ queryKey: foodKeys.lists() });
   }
   ```
5. The mutation calls `PATCH /foods/:foodId` using `buildFoodFormData`. Numeric fields cast to `String()` before stringify.
6. On success: close modal, toast "Food updated".

**Acceptance:** Editing a food: modal opens populated. Hit Save → modal closes, card updates **before** the network finishes, no page refresh, refresh shows persisted change. Force a network error (devtools offline) → toast error, list/detail revert to original.

---

### Phase 4 — Foods: delete (optimistic, confirmation modal)

**Deliverables:**
1. Register modal id `"food.delete"`. Payload: `{ foodId, foodName }`. Use MultiStepModal with a **single step** (it's general-purpose; one step is fine), `closeOnBackdrop: false`.
2. Body: "Delete **{foodName}**? This cannot be undone." Two buttons: `Cancel` (ghost), `Delete` (destructive).
3. The Delete button is the one that flips to `loading` (red spinner inside, label kept). The Cancel button is disabled while loading.
4. `useDeleteFood`:
   - `onMutate`: cancel queries, snapshot list caches, **remove the item from every cached list** + remove the detail cache entry, return rollback ctx.
   - `onError`: restore.
   - `onSettled`: invalidate lists.
5. On success: close modal, toast "Food deleted", if currently on the detail route of that food, `router.replace("/foods")`.

**Acceptance:** Click 🗑 → confirmation modal → click Delete → button shows red spinner → card disappears from the grid *immediately* → server confirms → toast. Offline test → card pops back, toast error.

---

### Phase 5 — Foods: create + add review

**Deliverables:**
1. Admin-only "New food" button on dashboard opens modal id `"food.create"` — same MultiStepModal, same 4 steps as update, all fields empty.
2. `useCreateFood` — no optimistic write (we don't have an `_id` yet); on success invalidate lists + close modal + toast.
3. On the food detail page, an "Add review" button opens modal `"food.review"` (single-step form: `customer_name`, `rating` (star input 0–5), `comment`, hidden `date = new Date().toISOString()`).
4. `useAddReview` — **optimistic**: push the new review into the cached detail's `food.reviews`, recompute `averageRating` client-side (mirror the server: `sum / count`). Rollback on error.

**Acceptance:** Create flow produces a food that appears in the list. Review flow shows the new review and updated average rating instantly.

---

### Phase 6 — Blogs (read + create + update + delete)

Mirror phases 2–5 for blogs, with these specifics from `blog.md`:

- Create uses multipart with `file` + `data` JSON. **Update uses plain JSON** (no multer on PATCH). Do not send FormData to PATCH.
- List endpoint **populates `author.user`** (full User object); detail endpoint does **not** (raw ObjectId string). Type as a union; narrow at render with a `getAuthorName(author)` helper.
- Update modal steps: 1) Title + category + tags, 2) Description + instructions (array editor — add/remove rows), 3) Status (only show to admins), 4) Review.
- Delete uses the same generic confirm modal pattern (`"blog.delete"`).
- Image cannot be changed via PATCH today — hide the image field in the update form and surface a small note: "Image is fixed after creation."
- Filter the public blog list with `status=approved`. The admin dashboard list passes no `status` so it sees all.

**Acceptance:** Identical UX guarantees as foods (optimistic everywhere, button-local spinners, modal-driven flows).

---

### Phase 7 — Global Search modal (replace the broken redirect)

This is the headline UX fix. Today the search icon in the home navbar **and** the dashboard navbar both navigate to a 404. Replace that with an in-app modal.

**Deliverables:**
1. Register modal id `"search"`. No multi-step needed — it's a single step but uses the same MultiStepModal shell (one step, custom width: `max-w-2xl`).
2. Inside, render `<GlobalSearch />`:
   - Auto-focused `<input>` with a search icon and ESC hint.
   - 300 ms debounce on the input value.
   - `useGlobalSearch(searchTerm)` — `useQuery` keyed by `["search", searchTerm]`, **enabled only when `searchTerm.length >= 2`**.
   - Renders **three grouped sections** in the fixed order from the doc: Blogs, Foods, Food Categories.
   - Each group only renders if its `source !== null` (use the server's contract, not array length).
   - Each result row: thumbnail + primary text + small badge with the source label. Keyboard arrows (`↑↓`) move highlight across all rows (flattened), `Enter` selects.
   - Empty state inside the modal when `searchTerm.length >= 2` and all three groups are null: `<EmptyState title="Nothing matches" hint="Try a different keyword" />`.
   - Initial state (no term yet): show recent searches from `localStorage` (cap at 8) — click one to re-run.
3. **Selecting a result navigates and closes the modal:**
   - Blog row → `/blogs/{id}` then `closeModal()`.
   - Food row → `/foods/{_id}` then `closeModal()`.
   - Food Category row → `/foods?foodCategory={categoryName}` then `closeModal()`.
4. **Wire both navbar search icons** (home + dashboard) to `openModal("search")`. Remove the broken `<Link>` to the dead route. Also bind a global hotkey: `Cmd/Ctrl + K` opens the modal.
5. Persist the chosen term to localStorage on selection so the recent-searches list works.

**Acceptance:** Cmd/Ctrl+K opens search anywhere. Typing 2+ chars shows grouped results. Arrow keys + Enter work. Selecting a food jumps to its detail page. Empty term → recent searches. No more 404 redirects from either navbar.

---

### Phase 8 — Cross-cutting polish (do not skip)

1. **Toaster:** install `sonner` (or your existing toaster). Standardize: `toast.success(...)`, `toast.error(err.message ?? "Something went wrong")`. All mutations toast on settle.
2. **Error boundary** around each major route segment with a "Try again" button that calls `queryClient.resetQueries()` for that segment's keys.
3. **Auth gating:** Admin-only UI (food create/update/delete buttons, blog status select, admin dashboard routes) reads from `useAuth().user?.role === "admin"`. Hide, don't just disable.
4. **URL state:** food list filters (`searchTerm`, `foodCategory`, `minPrice`, `maxPrice`, `isVeg`, `tags`, `sort`, `page`) are mirrored in `useSearchParams`. Pagination resets `page` to 1 on filter change.
5. **Prefetch:** on food card hover, `queryClient.prefetchQuery(foodKeys.detail(id), () => getFood(id))`. Same for blogs.
6. **Image optimization:** use `next/image` with the Cloudinary URL. Add the Cloudinary host to `next.config.js` `images.remotePatterns`.
7. **Suspense-friendly:** wrap each grid in a `<Suspense fallback={<GridSkeleton/>}>` if you opt into TanStack's `suspense` mode; otherwise the `isLoading` skeleton path is enough — pick one and be consistent.
8. **Dead code purge:** after each phase, delete the static mock data files that the phase replaced.

---

## 4. Optimistic update pattern — the one true template

Every mutation that touches a list-or-detail cache follows this exact shape. Copy it, don't reinvent it.

```ts
useMutation({
  mutationFn: (vars) => api.something(vars),
  onMutate: async (vars) => {
    await qc.cancelQueries({ queryKey: keys.relevant() });
    const snapshots = qc.getQueriesData({ queryKey: keys.relevant() });
    // write the optimistic shape into every relevant cache entry
    return { snapshots };
  },
  onError: (_err, _vars, ctx) => {
    ctx?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value));
    toast.error("Couldn't save. Reverted.");
  },
  onSuccess: () => toast.success("Saved"),
  onSettled: () => qc.invalidateQueries({ queryKey: keys.relevant() }),
});
```

Why this shape: cancel-snapshot-write-rollback-invalidate is the only pattern that survives concurrent mutations, slow networks, and tab refocus without flicker or lost writes. Do not skip `cancelQueries` — without it, an in-flight refetch can overwrite your optimistic write before the mutation finishes.

---

## 5. Folder layout snapshot (target end state)

```
src/
  app/                              # Next.js routes (already exist; you fill them in)
  features/
    foods/{api,hooks,components,schemas,types.ts,keys.ts}
    blogs/{api,hooks,components,schemas,types.ts,keys.ts}
    search/{api,hooks,components,types.ts}
  shared/
    lib/{http.ts,queryClient.ts,env.ts}
    stores/{modalStore.ts,authStore.ts}
    components/
      ui/{MultiStepModal.tsx,Button.tsx,EmptyState.tsx,Skeleton.tsx,Spinner.tsx,Toaster.tsx}
      forms/{TextField.tsx,NumberField.tsx,SelectField.tsx,TagsInput.tsx,SwitchField.tsx,ImageDropzone.tsx,StarRating.tsx}
    hooks/{useAuth.ts,useDebouncedValue.ts,useHotkey.ts}
    utils/{buildFoodFormData.ts,buildBlogFormData.ts,getAuthorName.ts}
```

---

## 6. Definition of Done (per feature)

A feature is done only when **all** of these are true:

- [ ] All endpoints from the corresponding doc are wired (no TODOs).
- [ ] List page: real data, skeleton, empty state, error state, retry, URL-synced filters.
- [ ] Detail page: real data, related items (foods), prefetch on hover from list.
- [ ] Create/Update flows go through MultiStepModal, forms pre-populate on update, RHF + zod validation matches server.
- [ ] Every mutation is optimistic with rollback; UI never waits for the server to reflect the change.
- [ ] Delete uses the shared confirm modal, button-local red spinner, removes from list instantly.
- [ ] Admin-only UI hidden for non-admins.
- [ ] Toaster on every success and failure.
- [ ] No `any`, no `console.log` left behind, no dead static fixtures.
- [ ] Typecheck passes. Dev server runs. Manual smoke test of the golden path + one offline failure path completed.

---

## 7. What NOT to do (lessons baked in)

- ❌ Don't build a separate modal per feature — reuse `MultiStepModal`.
- ❌ Don't store modal state in React local state of a parent — use the zustand store.
- ❌ Don't fetch with `useEffect`. Use TanStack Query.
- ❌ Don't `JSON.stringify` numbers when sending the food form's JSON `data` field — they must be strings (`"12.50"`), per the server's zod schema.
- ❌ Don't set `Content-Type` manually for multipart; let the browser set the boundary.
- ❌ Don't invalidate without first writing optimistically — that gives you a delay-then-flash UX.
- ❌ Don't render the search modal as a Next.js page or route — it's an in-app modal.
- ❌ Don't filter the global search response by `data.length > 0`; use `source !== null` (server contract).
- ❌ Don't try to update a blog image via PATCH — it's not wired server-side. Either add a note in the UI or coordinate a backend change first.
- ❌ Don't ship a phase with the previous phase's smoke test broken.

---

## 8. Final instruction to the agent

Work **phase by phase**, in order. After each phase, output:
1. The list of files you created/edited.
2. The acceptance checks you ran (and the result).
3. Any deviation from this prompt and the one-sentence reason.

Then ask before continuing to the next phase. No mega-PRs. No skipping ahead. Treat the three API docs as law.

Now begin Phase 1.
