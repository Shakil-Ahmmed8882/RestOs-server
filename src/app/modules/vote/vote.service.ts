import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Vote } from "./vote.model";
import { IVote } from "./vote.interface";

import mongoose from "mongoose";
import BlogModel from "../blog/blog.model";
import UserModel from "../user/user.model";
import { USER_STATUS } from "../../constants";
import createAnalyticsRecord from "../analytics/analytics.service";
import QueryBuilder from "../../builder/QueryBuilder";
import validateUserAndStatus from "../../helper/validateUserStatus";
import { formatTimestamp } from "../../utils/FormatTimestamp";

const createOrUpdateVote = async (
  payload: Pick<IVote, "voteType" | "user" | "blog">
) => {
  const { blog: blogId, user: userId, voteType } = payload;

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the post exists
    const blog = await BlogModel.findById(blogId).session(session);
    if (!blog) {
      throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
    }

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(httpStatus.NOT_FOUND, "User is blocked!");
    }

    // Check if the user has already voted on this post
    const existingVote = await Vote.findOne({
      blog: blogId,
      user: userId,
    }).session(session);

    if (existingVote) {
      // If the vote type is the same, no need to update
      if (existingVote.voteType === voteType) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "You have already voted with this type"
        );
      }

      // Update the vote type
      existingVote.voteType = voteType;
      await existingVote.save({ session });

      // Adjust the blogs vote counts
      if (voteType === "upvote") {
        blog.upvotes += 1;
        blog.downvotes -= 1;
        await blog.save({ session });

        // update like

        // Create analytics record for updating a vote
        await createAnalyticsRecord(
          {
            userName: user.name,
            resourceName: blog.title,
            description: `${user.name} Liked ${blog.title}}`,
            blog: new mongoose.Types.ObjectId(blogId),
            user: new mongoose.Types.ObjectId(userId),
            actionType: "upvote",
          },
          session
        );
      } else {
        blog.downvotes += 1;
        blog.upvotes -= 1;
        await blog.save({ session });

        // Update dislike analytics
        await createAnalyticsRecord(
          {
            userName: user.name,
            resourceName: blog.title,
            description: `${user.name} Disliked ${blog.title}`,
            blog: new mongoose.Types.ObjectId(blogId),
            user: new mongoose.Types.ObjectId(userId),
            actionType: "downvote",
          },
          session
        );
      }
    } else {
      // Create a new vote
      await Vote.create([{ blog: blogId, user: userId, voteType }], {
        session,
      });

      // Update blog vote counts
      if (voteType === "upvote") {
        blog.upvotes += 1;
      } else {
        blog.downvotes += 1;
      }

      // Create analytics record for updating a vote
      await createAnalyticsRecord(
        {
          userName: user.name,
          resourceName: blog.title,
          description: `${user.name} Liked ${blog.title}`,
          blog: new mongoose.Types.ObjectId(blogId),
          user: new mongoose.Types.ObjectId(userId),
          actionType: "upvote",
        },
        session
      );
    }

    // Save post changes
    await blog.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return existingVote || { postId: blogId, userId, voteType };
  } catch (error) {
    // If there's an error, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

const getAllVotesOnSingleBlog = async (
  blogId: string,
  query: Record<string, unknown>
) => {
  const voteQuery = new QueryBuilder(Vote.find({ blog: blogId }), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await voteQuery.modelQuery
    .populate({
      path: "user",
      select: "name photo email",
    })
    .populate({
      path: "blog",
      select: "title description",
    });

  const metaData = await voteQuery.countTotal();
  return {
    meta: metaData,
    data: result,
  };
};





const getSingleVoteOfSingleUser = async (blogId: string, userId: string) => {
  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const blog = await BlogModel.findById(blogId).session(session);

    if (!blog) {
      throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
    }

    // Find the vote for the given user and blog
    const vote = await Vote.findOne({ blog: blogId, user: userId }).session(session);

    // Commit the transaction only after the operations are complete
    await session.commitTransaction();

    // Return the voteType if everything is successful
    return { voteType: vote?.voteType }; // Safely access voteType in case vote is null
  } catch (error) {
    // If there's an error, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};





const deleteVote = async (blogId: string, userId: string) => {
  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await validateUserAndStatus(userId);
    const vote = await Vote.findOne({ blog: blogId, user: userId }).session(
      session
    );

    if (!vote) {
      throw new AppError(httpStatus.NOT_FOUND, "Vote not found");
    }

    if (vote.user.toString() !== userId.toString()) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized to delete this vote"
      );
    }

    // Update the post's vote count before removing
    const blog = await BlogModel.findById(vote.blog).session(session);
    if (!blog) {
      throw new AppError(httpStatus.NOT_FOUND, "Opps! ubBlog is not found");
    }

    if (blog) {
      if (vote.voteType === "upvote") {
        blog.upvotes -= 1;
      } else {
        blog.downvotes -= 1;
      }
      await blog.save({ session });
    }

    await createAnalyticsRecord(
      {
        userName: user.name,
        resourceName: blog?.title as string,
        description: `${user.name} removed a vote from ${blog.title}`,
        blog: new mongoose.Types.ObjectId(blogId),
        user: new mongoose.Types.ObjectId(userId),
        actionType: "downvote",
      },
      session
    );

    // Remove the vote
    await Vote.deleteOne({ _id: vote._id }).session(session);

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
  getAllVotesOnSingleBlog,
  getSingleVoteOfSingleUser,
};
