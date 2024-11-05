import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VoteService } from './vote.service'; // Assuming you have a VoteService with necessary methods

// Cast a vote (upvote/downvote) on a post
const createVote = catchAsync(async (req, res) => {
  const { post, voteType } = req.body;
  const { userId } = req.user;
  const result = await VoteService.createOrUpdateVote({post,user: userId,voteType});
  

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `Successfully ${voteType}d the post`,
    data: result,
  });
});

// Retrieve all votes (upvotes/downvotes) for a specific post

const getAllVotesOnSinglePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const result = await VoteService.getAllVotesOnSinglePost(postId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All votes are retrieved successfully',
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
    message: 'Vote deleted successfully',
    data: null,
  });
});

export const VoteController = {
  createVote,
  // getVotesForPost,
  // getMyVotes,
  // updateVote,
  getAllVotesOnSinglePost,
  deleteVote,
};
