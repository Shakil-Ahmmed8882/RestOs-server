import { Request, Response, Router } from "express";
import { uploadImage, uploadToCloudinary } from "../media-management";

const router = Router();

router.post(
  "/",
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
