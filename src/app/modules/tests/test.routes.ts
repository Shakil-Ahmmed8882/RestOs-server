import { Request, Response, Router } from "express";
import { uploadImage, uploadToCloudinary } from "../media-management";

const router = Router();

// Anonymous file-upload smoke test. Disabled in production to prevent
// strangers from abusing the Cloudinary account.
const isProd = process.env.NODE_ENV === "production";

router.post(
  "/",
  (req: Request, res: Response, next) => {
    if (isProd) {
      res.status(404).json({ success: false, message: "Not Found" });
      return;
    }
    next();
  },
  uploadImage.single("file"),
  async (req: Request, res: Response) => {
    let testImg: string | undefined;
    if (req.file?.buffer) {
      const imageName = `test-${Math.floor(Math.random() * 10)}-${Date.now()}`;
      const uploaded = await uploadToCloudinary({
        fileBuffer: req.file.buffer,
        folder: "tests",
        publicId: imageName,
      });
      testImg = uploaded.url;
    }
    res.send({ message: "test file upload", url: testImg });
  },
);

export const testRoutes = router;
