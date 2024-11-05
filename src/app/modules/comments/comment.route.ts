import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CommentController } from "./comment.controller";
import {
  createCommentValidationSchema,
  updateCommentValidationSchema,
} from "./comment.validation"; // Ensure to create these validation schemas
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = express.Router();

// Create a new comment
router.post(
  "/",  
  auth(USER_ROLE.USER,USER_ROLE.ADMIN),
  validateRequest(createCommentValidationSchema),
  CommentController.createComment
);

// Get all comments on a specific blog
router.get(
  "/:blogId",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  CommentController.getAllCommentsOnSingleBlog
);

// Get all comments
router.get("/", auth(USER_ROLE.ADMIN), CommentController.getAllComments);

// Update a comment by ID
router.patch(
  "/:commentId",
  auth( USER_ROLE.USER),
  validateRequest(updateCommentValidationSchema),
  CommentController.updateCommentById
);

// Delete a comment by ID
router.delete(
  "/:commentId",
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  CommentController.deleteCommentById
);




export const commentRoutes = router;
