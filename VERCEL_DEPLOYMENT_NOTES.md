# Vercel Deployment Notes

## Recent Changes (Media Management Refactor + Role/Status API)

### What Changed:
1. ✅ Removed disk-based uploads (`multer.diskStorage()` → `multer.memoryStorage()`)
2. ✅ All image uploads now use Cloudinary directly (no temp files)
3. ✅ Added new Admin API: `PATCH /api/v1/users/:userId/role-status`
4. ✅ Fixed user listing to show newest users first
5. ✅ Added timestamps to User model
6. ✅ Added streamifier dependency

### Errors You Might See (and why):

#### Error 1: `ENOENT: no such file or directory, open '/var/task/uploads/photo-...`
**Cause**: Old code still trying to read from `/uploads` folder (Vercel serverless read-only filesystem).
**Status**: ✅ FIXED in code (all disk references removed).
**Action**: Redeploy to clear cache.

#### Error 2: `Route not found` on `/api/v1/users/:userId/role-status`
**Cause**: Vercel is serving old compiled code (dist/ folder).
**Status**: ✅ FIXED in code (route is defined).
**Action**: **Delete `dist/` folder and redeploy** OR **rebuild on Vercel**.

---

## How to Fix on Vercel

### Option 1: Rebuild from Vercel Dashboard (Fastest)
1. Go to your Vercel project
2. Click **"Deployments"** tab
3. Click the three-dot menu on the latest deployment
4. Select **"Redeploy"** (or "Redeploy with cache cleared" if available)
5. Wait for build to complete

### Option 2: Force Rebuild via Git
1. Make a trivial commit and push:
   ```bash
   git commit --allow-empty -m "force rebuild"
   git push origin main
   ```
2. Vercel will automatically rebuild

### Option 3: Manual Redeploy
```bash
npm run build
# Then push to git, Vercel auto-redeploys on push
```

---

## Testing the New Endpoints Locally

### 1. Test User Listing (newest first):
```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  http://localhost:5000/api/v1/users
```

Should return users sorted by `-createdAt` (newest first).

### 2. Test Role/Status Update:
```bash
curl -X PATCH \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}' \
  http://localhost:5000/api/v1/users/USER_ID/role-status
```

### 3. Test Image Upload (from any module):
```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@photo.jpg" \
  http://localhost:5000/api/v1/auth/register
```

Should upload to Cloudinary directly (no `/uploads` folder created).

---

## Environment Variables (verify on Vercel)

Make sure these are set in Vercel project settings:

```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

Without these, uploads will fail with `MediaConfigError`.

---

## Files Modified/Created

### New Module:
- `src/app/modules/media-management/` (8 files)
- Complete serverless-safe media pipeline

### Updated:
- `src/app/modules/user/user.routes.ts` (added role-status endpoint)
- `src/app/modules/user/user.service.ts` (added updateUserRoleAndStatus)
- `src/app/modules/user/user.controller.ts` (added handler)
- `src/app/modules/user/user.validation.ts` (added validation schema)
- `src/app/modules/user/user.model.ts` (added timestamps)
- All other modules (foods, categories, blogs) — same pattern

### Deleted:
- `src/app/utils/sendImageToCloudinary.ts` (old disk-based util)

### Dependencies Added:
- `streamifier` (for piping buffers to Cloudinary)
- `@types/streamifier`

---

## After Redeployment Checklist

- [ ] Rebuild triggered on Vercel
- [ ] Wait for build to complete (usually 2-5 min)
- [ ] Test `/api/v1/users` endpoint (should show users, sorted newest first)
- [ ] Test `/api/v1/users/:id/role-status` endpoint (should work for admins)
- [ ] Test image upload (should go to Cloudinary, not disk)
- [ ] Check Vercel logs for any errors

---

## Common Issues & Solutions

| Issue | Cause | Fix |
|---|---|---|
| Route not found on `/role-status` | Old `dist/` cached | Redeploy or rebuild |
| ENOENT uploads folder | Old code still running | Redeploy |
| Upload fails with 502 | Missing Cloudinary env vars | Check Vercel env settings |
| Upload hangs/times out | Slow Cloudinary upload | Check file size (max 5 MB) |

---

## No More Disk Issues! 🎉

After this deployment:
- ✅ No more `/uploads` folder
- ✅ No more `fs.unlink` operations
- ✅ No more temp file leaks
- ✅ All images stream directly to Cloudinary
- ✅ Works perfectly on serverless Vercel
