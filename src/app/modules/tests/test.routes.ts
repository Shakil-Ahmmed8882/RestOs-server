import { Request, Response, Router } from "express";
import { sendImageToCloudinary, upload } from "../../utils/sendImageToCloudinary";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  console.log({ file: req.file });
  let testImag;
  if (req.file) {
    const imageName = `${Math.floor(Math.random() * 10)}-name`;
    const path = req.file?.path;

    //send image to cloudinary
    const { secure_url } = await sendImageToCloudinary(imageName, path);
    testImag = secure_url as string;
  }

  console.log(testImag);
  res.send("test file upload ");
});

export const testRoutes = router;
