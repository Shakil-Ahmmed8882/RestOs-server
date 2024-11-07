import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { VoteService } from "./vote.service";

// Cast a vote (upvote/downvote) on a post
const createVote = catchAsync(async (req, res) => {
  const { blog, voteType } = req.body;
  const { userId } = req.user;
  const result = await VoteService.createOrUpdateVote({
    blog,
    user: userId,
    voteType,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `Successfully ${voteType}d the blog`,
    data: result,
  });
});

// Retrieve all votes (upvotes/downvotes) for a specific post

const getAllVotesOnSinglePost = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const result = await VoteService.getAllVotesOnSinglePost(blogId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All votes are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Delete a vote (undo the vote)
const deleteVote = catchAsync(async (req, res) => {
  const { voteId } = req.params;
  const userId = req.user.userId;

  await VoteService.deleteVote(voteId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vote deleted successfully",
    data: null,
  });
});

export const VoteController = {
  createVote,
  getAllVotesOnSinglePost,
  deleteVote,
};
