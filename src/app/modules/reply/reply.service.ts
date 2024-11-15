import httpStatus from "http-status";

// import { JwtPayload } from 'jsonwebtoken';
// import createAnalyticsRecord from '../../utils/createAnalyticsRecord';
import mongoose from "mongoose";
import { USER_STATUS } from "../../constants";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import { Comment } from "../comments/comment.model";
import createAnalyticsRecord from "../analytics/analytics.service";
import validateBlogExistence from "../../helper/validateBlogExistance";
import validateUserAndStatus from "../../helper/validateUserStatus";

// ================= add reply ===================
const addReplyToComment = async (
  commentId: string,
  userId: string,
  payload: { blogId: string; replyText: string }
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    console.log({ payload });

    // Check if the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "User is blocked and cannot reply to comments"
      );
    }

    // Find the comment to reply to
    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
    }

    // Push the reply to the replies array
    const reply = {
      user: userId,
      comment: payload.replyText,
      createdAt: new Date(),
    };

    comment.replies.push(reply);
    // Save the updated comment with the new reply
    const updatedComment = await comment.save({ session });

    const blog = await validateBlogExistence(payload.blogId);

    // Create analytics record for updating a vote
    await createAnalyticsRecord(
      {
        userName: user.name,
        resourceName: blog.title,
        description: `${user.name} Replyed on ${blog.title}'s comment`,
        blog: new mongoose.Types.ObjectId(payload.blogId),
        user: new mongoose.Types.ObjectId(userId),
        actionType: "comment",
      },
      session
    );

    await session.commitTransaction();
    return updatedComment;
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Transaction aborted:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// ================= Update Reply ===================
const updateReply = async (
  commentId: string,
  replyId: string,
  userId: string,
  payload: { replyText: string; blogId: string }
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Record the analytics
    const blog = await validateBlogExistence(payload.blogId);
    const user = await validateUserAndStatus(userId);

    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
    }

    const reply = comment.replies.id(replyId);

    if (!reply) {
      throw new AppError(httpStatus.NOT_FOUND, "Reply not found");
    }

    // Check if the reply belongs to the user making the request
    if (reply.user.toString() !== userId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to update this reply"
      );
    }

    // Update the reply text
    reply.comment = payload.replyText;
    const updatedComment = await comment.save({ session });

    await createAnalyticsRecord(
      {
        userName: user.name,
        resourceName: blog.title,
        description: `${user.name} updated reply on ${blog.title}'s comment`,
        blog: new mongoose.Types.ObjectId(payload.blogId),
        user: new mongoose.Types.ObjectId(userId),
        actionType: "comment",
      },
      session
    );

    await session.commitTransaction();
    return updatedComment;
  } catch (error: any) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ================= Delete Reply ===================
const deleteReply = async (
  commentId: string,
  replyId: string,
  userId: string,
  userRole: string
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await validateUserAndStatus(userId);
    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      throw new AppError(httpStatus.NOT_FOUND, "Reply not found");
    }

    // Check if the user is authorized to delete the reply (either the replier or an admin)
    if (reply.user.toString() !== userId.toString() && userRole !== "ADMIN") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to delete this reply"
      );
    }

    // Remove the reply from the replies array using pull()
    comment.replies.pull(replyId);
    const updatedComment = await comment.save({ session });
    // Create analytics record for updating a vote

    await session.commitTransaction();
    return updatedComment;
  } catch (error: any) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const replyServices = {
  addReplyToComment,
  updateReply,
  deleteReply,
};
