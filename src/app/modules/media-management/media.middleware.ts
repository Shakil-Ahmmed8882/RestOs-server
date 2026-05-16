import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MEDIA_LIMITS,
} from './media.constants';

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error(`Unsupported file type: ${file.mimetype}`));
};

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MEDIA_LIMITS.MAX_FILE_SIZE_BYTES,
    files: MEDIA_LIMITS.MAX_FILES_PER_REQUEST,
  },
  fileFilter: imageFileFilter,
});

export const uploadImage = {
  single: (field: string) => memoryUpload.single(field),
  array: (field: string, max = MEDIA_LIMITS.MAX_FILES_PER_REQUEST) =>
    memoryUpload.array(field, max),
  fields: (fields: multer.Field[]) => memoryUpload.fields(fields),
  none: () => memoryUpload.none(),
};

export const rawMulterImage = memoryUpload;

/**
 * Developer Guide: How to use uploadImage middleware
 *
 * ============================================================================
 * SCENARIO 1: Single image upload (user profile photo, food image, etc)
 * ============================================================================
 *
 * Use Case: One file, one field. Example: user uploads a profile picture.
 *
 * Route Definition:
 * ─────────────────
 *   router.post(
 *     '/update-profile',
 *     uploadImage.single('photo'),  ← expects <input type="file" name="photo">
 *     controller.handleUpdateProfile,
 *   );
 *
 * Frontend (HTML Form):
 * ─────────────────────
 *   <form enctype="multipart/form-data">
 *     <input type="file" name="photo">  ← name MUST match 'photo'
 *     <button type="submit">Upload</button>
 *   </form>
 *
 * Controller/Service Access:
 * ──────────────────────────
 *   const handleUpdateProfile = async (req, res) => {
 *     const file = req.file;  ← single file available here
 *     if (file?.buffer) {
 *       const uploaded = await uploadToCloudinary({
 *         fileBuffer: file.buffer,  ← use .buffer, NOT .path
 *         folder: 'users',
 *         publicId: `user-${userId}`,
 *       });
 *     }
 *   };
 *
 * What it does:
 * ─────────────
 * - Waits for exactly ONE file on the 'photo' field
 * - If no file or file is wrong MIME type → multer rejects before handler runs
 * - File lives in RAM as req.file.buffer
 * - Automatically validates: must be image (jpeg/png/webp/gif), max 5 MB
 * - After response, buffer is garbage-collected
 *
 * ============================================================================
 * SCENARIO 2: Multiple images (photo gallery, product images, etc)
 * ============================================================================
 *
 * Use Case: Upload 2–5 images in one request. Example: food gallery.
 *
 * Route Definition:
 * ─────────────────
 *   router.post(
 *     '/create-food',
 *     uploadImage.array('images', 5),  ← accepts up to 5 files on 'images' field
 *     controller.handleCreateFood,
 *   );
 *
 * Frontend (HTML Form):
 * ─────────────────────
 *   <form enctype="multipart/form-data">
 *     <input type="file" name="images" multiple>  ← "multiple" allows 2–5 files
 *     <button type="submit">Upload</button>
 *   </form>
 *
 * Controller/Service Access:
 * ──────────────────────────
 *   const handleCreateFood = async (req, res) => {
 *     const files = req.files;  ← array of files
 *     if (files && files.length > 0) {
 *       const uploads = await Promise.all(
 *         files.map(file =>
 *           uploadToCloudinary({
 *             fileBuffer: file.buffer,
 *             folder: 'foods',
 *             publicId: `food-gallery-${Date.now()}-${Math.random()}`,
 *           })
 *         )
 *       );
 *       // uploads = [{ url, public_id }, { url, public_id }, ...]
 *     }
 *   };
 *
 * What it does:
 * ─────────────
 * - Accepts 1 to N files (up to 5 in this example)
 * - If user sends 0 files → OK, just skip upload logic
 * - If user sends 6+ files → multer rejects before handler
 * - If any file fails MIME/size check → entire upload rejected
 * - All files validated before handler, all or nothing
 * - Each file.buffer is independent in RAM
 *
 * ============================================================================
 * SCENARIO 3: Mixed fields (one photo + one video + one PDF, etc)
 * ============================================================================
 *
 * Use Case: Different field names, different types. Example: blog post with
 * featured image + author photo + optional attachment.
 *
 * Route Definition:
 * ─────────────────
 *   router.post(
 *     '/create-blog',
 *     uploadImage.fields([
 *       { name: 'featuredImage', maxCount: 1 },  ← exactly 1 file
 *       { name: 'authorPhoto', maxCount: 1 },    ← exactly 1 file
 *     ]),
 *     controller.handleCreateBlog,
 *   );
 *
 * Frontend (HTML Form):
 * ─────────────────────
 *   <form enctype="multipart/form-data">
 *     Featured Image: <input type="file" name="featuredImage">
 *     Author Photo:   <input type="file" name="authorPhoto">
 *     <button type="submit">Create Blog</button>
 *   </form>
 *
 * Controller/Service Access:
 * ──────────────────────────
 *   const handleCreateBlog = async (req, res) => {
 *     const featured = req.files?.featuredImage?.[0];  ← array of 1
 *     const author = req.files?.authorPhoto?.[0];       ← array of 1
 *
 *     if (featured?.buffer) {
 *       const uploadedFeatured = await uploadToCloudinary({
 *         fileBuffer: featured.buffer,
 *         folder: 'blogs',
 *         publicId: `blog-featured-${blogId}`,
 *       });
 *     }
 *     if (author?.buffer) {
 *       const uploadedAuthor = await uploadToCloudinary({
 *         fileBuffer: author.buffer,
 *         folder: 'users',
 *         publicId: `user-author-${userId}`,
 *       });
 *     }
 *   };
 *
 * What it does:
 * ─────────────
 * - Each field name is independent
 * - maxCount: how many files allowed for that field (1, 2, 5, etc)
 * - Each field is validated separately (all MIME, all sizes checked)
 * - req.files = { fieldName: [ { buffer, ... }, ... ], ... }
 * - Missing a field is OK (just check ?.[] before use)
 *
 * ============================================================================
 * SCENARIO 4: No file upload (just parsing form data)
 * ============================================================================
 *
 * Use Case: Sometimes you have a route that *might* get a file, but it's
 * optional. Or you want to handle file upload in a sub-route while the main
 * route doesn't accept files.
 *
 * Route Definition:
 * ─────────────────
 *   router.post(
 *     '/update-bio',
 *     uploadImage.none(),  ← no file expected, just form fields
 *     controller.handleUpdateBio,
 *   );
 *
 * Controller/Service Access:
 * ──────────────────────────
 *   const handleUpdateBio = async (req, res) => {
 *     const { bio, name } = req.body;  ← only form fields, no files
 *     // Update the user bio and name (no image upload)
 *   };
 *
 * What it does:
 * ─────────────
 * - Rejects if client tries to send a file anyway
 * - Parses form fields normally (text, checkboxes, etc)
 * - Useful for consistency: same middleware used everywhere, but .none()
 *   explicitly says "this endpoint has no file upload"
 *
 * ============================================================================
 * COMMON PATTERNS & TIPS
 * ============================================================================
 *
 * Pattern 1: Optional image upload
 * ─────────────────────────────────
 *   router.patch(
 *     '/:userId',
 *     uploadImage.single('photo'),  ← use single() even if optional
 *     controller.handleUpdate,
 *   );
 *
 *   const handleUpdate = async (req, res) => {
 *     if (req.file?.buffer) {  ← check if file was actually sent
 *       // upload to cloudinary
 *     }
 *     // update other fields (name, email, etc)
 *   };
 *
 * Pattern 2: Form data with file + JSON body
 * ───────────────────────────────────────────
 *   // Frontend sends: multipart/form-data with 'file' + 'data' fields
 *   const formData = new FormData();
 *   formData.append('file', fileInput.files[0]);
 *   formData.append('data', JSON.stringify({ name: 'John', ... }));
 *   fetch('/api/v1/foods/create-food', {
 *     method: 'POST',
 *     body: formData,
 *   });
 *
 *   // Backend route
 *   router.post(
 *     '/create-food',
 *     uploadImage.single('file'),
 *     parseBody,  ← custom middleware to parse JSON from 'data' field
 *     validateRequest(schema),
 *     controller.handleCreateFood,
 *   );
 *
 * Pattern 3: Validation errors
 * ─────────────────────────────
 * If a file is rejected (bad MIME, too big, etc), multer throws an error
 * before your handler runs. The global error handler catches it and responds:
 *
 *   {
 *     "success": false,
 *     "statusCode": 400,
 *     "message": "Unexpected field or file too large",
 *   }
 *
 * No need to manually check file.size or file.mimetype — it's done.
 *
 * ============================================================================
 * SUMMARY TABLE
 * ============================================================================
 *
 * | Use case               | Middleware              | req.file(s) access       |
 * |------------------------|-------------------------|--------------------------|
 * | One image              | .single('fieldName')    | req.file.buffer          |
 * | Multiple images        | .array('fieldName', N)  | req.files[i].buffer      |
 * | Mixed fields           | .fields([...])          | req.files.fieldName[i]   |
 * | No file (form only)    | .none()                 | (none)                   |
 *
 * All support:
 * - Automatic MIME type validation (images only)
 * - Automatic file size limit (5 MB per file)
 * - Memory storage (no disk, RAM only, auto-gc)
 * - Streaming to Cloudinary via upload_stream + streamifier
 *
 * ============================================================================
 */
