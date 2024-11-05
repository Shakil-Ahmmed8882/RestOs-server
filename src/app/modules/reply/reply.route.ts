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


// Update a reply to a comment by reply ID
router.patch(
    "/comments/:commentId/reply/:replyId",
    auth(USER_ROLE.USER),
    validateRequest(replyCommentValidationSchema),
    replyControllers.handleUpdateReply
  );
  
  // Delete a reply to a comment by reply ID
  router.delete(
    "/comments/:commentId/reply/:replyId",
    auth(USER_ROLE.USER, USER_ROLE.ADMIN),
    replyControllers.handleDeleteReply
  );


export const replyRoutes = router;
