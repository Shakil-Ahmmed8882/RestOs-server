# Media Management

A loosely-coupled, serverless-safe media pipeline for RestOS. Every module
(users, foods, restaurants, categories, blogs, …) routes uploads and deletions
through this layer instead of talking to Cloudinary directly.

---

## Why this module exists — what was wrong before

The previous implementation lived in `src/app/utils/sendImageToCloudinary.ts`
and used `multer.diskStorage()` + `cloudinary.uploader.upload(path)`:

```ts
// OLD — disk-based
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.cwd() + '/uploads'),
  filename:    (req, file, cb) => cb(null, file.fieldname + '-' + Date.now()),
});
cloudinary.uploader.upload(file.path, { public_id }, (err, result) => {
  // ...then fs.unlink(file.path)
});
```

This worked on a long-lived server, but broke on Vercel serverless. Concretely:

| Problem with the old design | Why it failed on serverless |
|---|---|
| Wrote temp files to `process.cwd() + '/uploads'` | The Vercel function filesystem is **read-only** outside of `/tmp`; cwd writes either fail or silently corrupt state. |
| Two-phase pipeline (disk → Cloudinary → `fs.unlink`) | Each phase added latency to the function's 10–15s budget; a cold start + big image often hit the **timeout**. |
| `fs.unlink` ran *after* `resolve(result)` | If the function froze right after responding, the temp file leaked. On a warm container the leak grew until the next cold start wiped it. |
| Disk IO blocked the event loop | Wasted memory & CPU on a runtime billed by ms. |
| Wrote and consumed real filenames | Public IDs were derived from `Math.random()` / `Date.now()` → no determinism, no overwrite semantics, no way to clean up. |
| Stored only `secure_url` in the DB | Deletion required `public_id`; without it, every replaced image **orphaned** in Cloudinary forever. |
| `if (error) reject; resolve(result)` (both ran) | The Promise was always resolved, even on errors → the caller saw `undefined.secure_url` instead of a real error. |
| Cloudinary credentials were configured at import time | If the env vars weren't loaded yet, the SDK silently used defaults. No surface error. |
| Module mixed multer, Cloudinary, fs, and config | Tight coupling — every consumer (foods, users, blogs, …) imported the same util and copy-pasted the same `secure_url as string` cast. |

---

## What this module does instead

```
                                ┌────────────────────────┐
   multipart/form-data ──▶ multer.memoryStorage()        │
                                │  (validates mime+size) │
                                ▼                        │
                          req.file.buffer (RAM)          │
                                │                        │
                                ▼                        │
                       uploadToCloudinary({...})         │
                                │                        │
                streamifier.createReadStream(buffer)     │
                                │                        │
                                ▼                        │
                  cloudinary.uploader.upload_stream      │
                                │                        │
                                ▼                        │
                     { url, public_id, ... }  ──▶ DB     │
                                                         │
   on update/delete: deleteFromCloudinary(publicId) ─────┘
```

| Concern | How we solved it |
|---|---|
| **No disk** | `multer.memoryStorage()` → the file lives only in `req.file.buffer`. No `uploads/` directory, no `fs.unlink`. |
| **Stream from RAM to Cloudinary** | `cloudinary.uploader.upload_stream()` + `streamifier.createReadStream(buffer).pipe(stream)`. Buffer is garbage-collected as soon as the request ends. |
| **Lazy, validated config** | `ensureCloudinaryConfigured()` runs once on first use and throws `MediaConfigError` if env vars are missing. Configuration never silently no-ops. |
| **Deterministic public IDs** | Each module computes a stable id (e.g. `user-<id>`, `food-<name>-<origin>`, `category-<name>`). Combined with `overwrite: true`, an update **replaces in place** instead of creating a new asset. |
| **Folder hygiene** | Every asset lands under `RestOS/<folder>/…` — `RestOS/users/`, `RestOS/foods/`, `RestOS/categories/`, `RestOS/blogs/`, `RestOS/tests/`. |
| **No orphans** | We store `{ url, public_id }` on every entity. Update: upload new → commit DB → delete old. Delete entity: commit DB delete → delete asset. |
| **Crash-safe ordering** | New upload happens **before** the DB write. If the DB write throws, the catch block calls `deleteFromCloudinary(newlyUploadedPublicId)` to roll back the upload. We never end up with an orphan from a failed update. |
| **Idempotent deletes** | `deleteFromCloudinary(undefined)` returns silently. `"not found"` from Cloudinary is treated as success. Failures are logged, not thrown, so a missing asset doesn't break an entity delete. |
| **Typed errors** | `MediaUploadError`, `MediaDeleteError`, `MediaConfigError`, `InvalidMediaError` — all extend `AppError` so the global error handler renders them with the right status code. |
| **Mime + size validation up front** | The multer middleware rejects non-image uploads (`image/jpeg|png|webp|gif`) and anything over 5 MB **before** the handler runs, so we never burn function time on a doomed upload. |
| **Optimization defaults** | `quality: auto`, `fetch_format: auto` are applied automatically. Callers can override `transformation` / `eager`. |
| **Loose coupling** | Domain modules never `import cloudinary`. They only import the public surface in `media-management/index.ts`. Adding video support, swapping providers, or changing folder layout is a one-file change. |

---

## Public API

```ts
import {
  uploadImage,           // multer middleware factory
  uploadToCloudinary,    // single upload from buffer
  uploadManyToCloudinary,// parallel uploads
  deleteFromCloudinary,  // safe delete by public_id
  deleteManyFromCloudinary,
  UploadOptions,
  UploadedMedia,
  StoredMedia,
} from '../media-management';
```

### Upload middleware

```ts
router.post('/create-food',
  uploadImage.single('file'),               // single image, field name = "file"
  parseBody,
  validateRequest(schema),
  controller.handleCreateFood,
);

router.post('/gallery',
  uploadImage.array('photos', 5),           // up to 5 images
  controller.handleGalleryUpload,
);
```

### Single upload from a controller/service

```ts
const uploaded = await uploadToCloudinary({
  fileBuffer: file.buffer,
  folder: 'users',                          // → RestOS/users/
  publicId: `user-${userId}`,               // deterministic
  overwrite: true,                          // default
  // transformation, eager, tags optional
});
// uploaded = { url, public_id, width, height, format, bytes, resource_type }
```

### Delete

```ts
await deleteFromCloudinary(entity.photoPublicId);   // safe on null/undefined
```

---

## Update flow (reference)

```ts
const updateUser = async (userId, payload, file) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let newlyUploadedPublicId: string | undefined;
  let oldPublicIdToDelete:   string | undefined;

  try {
    const existing = await UserModel.findById(userId).session(session);

    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: 'users',
        publicId: `user-${userId}`,
      });
      payload.photo          = uploaded.url;
      payload.photoPublicId  = uploaded.public_id;
      newlyUploadedPublicId  = uploaded.public_id;

      if (existing.photoPublicId && existing.photoPublicId !== uploaded.public_id) {
        oldPublicIdToDelete = existing.photoPublicId;
      }
    }

    const result = await UserModel.findByIdAndUpdate(userId, payload, { new: true, session });
    await session.commitTransaction();

    // DB is durable now → safe to drop the old asset.
    if (oldPublicIdToDelete) await deleteFromCloudinary(oldPublicIdToDelete);
    return result;

  } catch (err) {
    await session.abortTransaction();
    // DB never committed → drop the asset we just uploaded.
    if (newlyUploadedPublicId) await deleteFromCloudinary(newlyUploadedPublicId);
    throw err;
  } finally {
    await session.endSession();
  }
};
```

## Delete flow (reference)

```ts
const deleteFood = async (foodId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deleted = await FoodModel.findByIdAndDelete(foodId, { session });
    await session.commitTransaction();
    if (deleted?.foodImagePublicId) {
      await deleteFromCloudinary(deleted.foodImagePublicId);
    }
    return { deletedFood: deleted };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
```

> Order matters: commit the DB delete first, then delete the asset. If the
> asset-delete fails, the entity is already gone and we just log; no
> inconsistency. If we deleted the asset first and the DB delete failed, the
> entity would point at a 404.

---

## Database shape

Every entity that holds an image stores both fields:

```ts
{
  photo:          string,   // secure_url    — for the client
  photoPublicId:  string,   // public_id     — for deletion / overwrite
}
```

| Module | URL field | public_id field |
|---|---|---|
| user | `photo` | `photoPublicId` |
| food | `foodImage` | `foodImagePublicId` |
| food-category | `image` | `imagePublicId` |
| blog | `image` | `imagePublicId` |

---

## Folder structure on Cloudinary

```
RestOS/
├── users/         user-<id>
├── foods/         food-<name>-<origin>
├── categories/    category-<name>
├── blogs/         blog-<author>-<title>-<ts>
└── tests/         test-*
```

---

## Files in this module

```
media-management/
├── index.ts                ← public surface (only thing other modules import)
├── cloudinary.config.ts    ← lazy, validated SDK setup
├── media.constants.ts      ← root folder, size limits, allowed mimes, defaults
├── media.types.ts          ← UploadOptions, UploadedMedia, StoredMedia, ...
├── media.errors.ts         ← typed AppError subclasses
├── media.middleware.ts     ← multer.memoryStorage() + mime/size filter
├── media.upload.ts         ← uploadToCloudinary / uploadManyToCloudinary
├── media.delete.ts         ← deleteFromCloudinary / deleteManyFromCloudinary
└── README.md               ← this file
```

---

## Environment variables

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Missing any of these throws `MediaConfigError` the first time an upload or
delete is attempted — never a silent misconfiguration.

---

## Extending

- **Video uploads**: pass `resourceType: 'video'` to `uploadToCloudinary` and to
  `deleteFromCloudinary`. Add a `video/*` mime check in `media.middleware.ts`
  or build a parallel `uploadVideo` middleware.
- **New domain folder**: just pass `folder: 'restaurants'` (or any string).
  Asset lands under `RestOS/restaurants/`. No code change here.
- **Eager transformations**: pass `eager: [{ width: 400, crop: 'fill' }]` to
  generate derived sizes at upload time.
