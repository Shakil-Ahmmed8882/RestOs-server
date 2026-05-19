import { NextFunction, Request, Response, Router } from "express";
import validateRequest from "../../utils/validateRequest";
import { blogValidations } from "./blog.validation";
import { blogControllers } from "./blog.controller";
import { uploadImage } from "../media-management";
import parseBody from "../../utils/parseBody";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();

router.post(
  "/create",
  uploadImage.single("file"),
  parseBody,
  validateRequest(blogValidations.createBlogValidationSchema),
  blogControllers.handleCreateBlog
);

router.get("/", blogControllers.handleGetAllBlogs);

// "Me" endpoints — author from JWT. Must come BEFORE /:id so literal paths win.
router.get(
  "/me",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  blogControllers.handleGetMyBlogs
);
router.get(
  "/me/stats",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  blogControllers.handleGetMyBlogsStats
);

router.get("/:id", blogControllers.handleGetBlogById);

router.patch(
  "/:id",
  validateRequest(blogValidations.updateBlogValidationSchema),
  blogControllers.handleUpdateBlogById
);

router.delete("/:id", blogControllers.handleDeleteBlogById);

export const blogRoutes = router;
