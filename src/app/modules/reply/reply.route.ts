import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";
import validateRequest from "../../utils/validateRequest";
import { replyCommentValidationSchema } from "./reply.validation";
import { replyControllers } from "./reply.controller";

const router = express.Router();

// reply to a comment by ID
router.post(
  "/:commentId/reply",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  validateRequest(replyCommentValidationSchema), 
  replyControllers.handleAddReplyToComment
);


export const replyRoutes = router;
