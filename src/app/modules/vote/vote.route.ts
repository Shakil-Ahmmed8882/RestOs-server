import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { VoteController } from "./vote.controller"; // Assuming you have a VoteController
import { createVoteValidationSchema } from "./vote.validation";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = express.Router();

// Cast a vote (upvote or downvote) on a post
router.post(
  "/",
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  validateRequest(createVoteValidationSchema),
  VoteController.createVote
);

// Get all votes on signgle post
router.get(
  "/:blogId",
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  VoteController.getAllVotesOnSinglePost
);

// Delete a vote (if user wants to undo their vote)
router.delete(
  "/:voteId",
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  VoteController.deleteVote
);

// Export the Vote Routes
export const voteRoutes = router;
