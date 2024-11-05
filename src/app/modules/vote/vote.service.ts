import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Vote } from './vote.model';
import { IVote } from './vote.interface';
import { Post } from '../post/post.model';

import mongoose from 'mongoose';
import { User } from '../User/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import createAnalyticsRecord from '../../utils/createAnalyticsRecord';

const createOrUpdateVote = async (
  payload: Pick<IVote, 'voteType' | 'user' | 'post'>,
) => {
  const { post: postId, user: userId, voteType } = payload;

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the post exists
    const post = await Post.findById(postId).session(session);
    if (!post) {
      throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if the user has already voted on this post
    const existingVote = await Vote.findOne({
      post: postId,
      user: userId,
    }).session(session);

    if (existingVote) {
      // If the vote type is the same, no need to update
      if (existingVote.voteType === voteType) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'You have already voted with this type',
        );
      }

      // Update the vote type
      existingVote.voteType = voteType;
      await existingVote.save({ session });

      // Adjust the post's vote counts
      if (voteType === 'upvote') {
        user.isVerified = true;
        // await user.save({ session });

        post.upvotes += 1;
        post.downvotes -= 1;
      } else {
        user.isVerified = false;
        // await user.save({ session });

        post.downvotes += 1;
        post.upvotes -= 1;
      }

      // Create analytics record for updating a vote
      await createAnalyticsRecord(
        {
          post: postId,
          user: userId,
          actionType: voteType === 'upvote' ? 'upvote' : 'downvote',
        },
        session,
      );
    } else {
      // Create a new vote
      await Vote.create([{ post: postId, user: userId, voteType }], {
        session,
      });

      // Update post vote counts
      if (voteType === 'upvote') {
        post.upvotes += 1;
      } else {
        post.downvotes += 1;
      }

      // Create analytics record for new vote
      await createAnalyticsRecord(
        {
          post: postId,
          user: userId,
          actionType: voteType === 'upvote' ? 'upvote' : 'downvote',
        },
        session,
      );
    }

    // Save post changes
    await post.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return existingVote || { postId, userId, voteType };
  } catch (error) {
    // If there's an error, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

const getAllVotesOnSinglePost = async (
  postId: string,
  query: Record<string, unknown>,
) => {
  const voteQuery = new QueryBuilder(Vote.find({ post: postId }), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await voteQuery.modelQuery
    .populate({
      path: 'user',
      select: 'username profilePhoto email',
    })
    .populate({
      path: 'post',
      select: 'title content',
    });

  const metaData = await voteQuery.countTotal();
  return {
    meta: metaData,
    data: result,
  };
};

const deleteVote = async (voteId: string, userId: string) => {
  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vote = await Vote.findById(voteId).session(session);

    if (!vote) {
      throw new AppError(httpStatus.NOT_FOUND, 'Vote not found');
    }

    if (vote.userId.toString() !== userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not authorized to delete this vote',
      );
    }

    // Update the post's vote count before removing
    const post = await Post.findById(vote.postId).session(session);
    if (post) {
      if (vote.voteType === 'upvote') {
        post.upvotes -= 1;
      } else {
        post.downvotes -= 1;
      }
      await post.save({ session });
    }

    // Remove the vote
    await Vote.deleteOne({ _id: voteId }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    return null;
  } catch (error) {
    // If there's an error, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

export const VoteService = {
  createOrUpdateVote,
  deleteVote,
  getAllVotesOnSinglePost,
};
