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

// Retrieve all votes (upvotes/downvotes) for a specific blog

const getAllVotesOnSingleBlog = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const result = await VoteService.getAllVotesOnSingleBlog(blogId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All votes are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleVoteOfSingleUser = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const {userId} = req.user
  const result = await VoteService.getSingleVoteOfSingleUser(blogId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signle vote on a blog retrieved successfully",
    data: result,
  });
});

// Delete a vote (undo the vote)
const deleteVote = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.userId;

  await VoteService.deleteVote(blogId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vote deleted successfully",
    data: null,
  });
});

export const VoteController = {
  createVote,
   getAllVotesOnSingleBlog,
  deleteVote,
 getSingleVoteOfSingleUser
};
