import { NextFunction, Request, Response, Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { blogValidations } from "./blog.validation";
import { blogControllers } from "./blog.controller";
import { upload } from "../../utils/sendImageToCloudinary";
import parseBody from "../../utils/parseBody";

const router = Router();

router.post(
  "/create",
  upload.single("file"),
  parseBody,
  validateRequest(blogValidations.createBlogValidationSchema),
  blogControllers.handleCreateBlog
);

router.get("/", blogControllers.handleGetAllBlogs);

router.get("/:id", blogControllers.handleGetBlogById);

router.patch(
  "/:id",
  validateRequest(blogValidations.updateBlogValidationSchema),
  blogControllers.handleUpdateBlogById
);

router.delete("/:id", blogControllers.handleDeleteBlogById);

export const blogRoutes = router;
