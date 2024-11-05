import httpStatus from "http-status";

// import { JwtPayload } from 'jsonwebtoken';
// import createAnalyticsRecord from '../../utils/createAnalyticsRecord';
import mongoose from "mongoose";
import { USER_STATUS } from "../../constants";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import { Comment } from "../comments/comment.model";

// ================= add reply ===================
const addReplyToComment = async (
  commentId: string,
  userId: string,
  replyText: string
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

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
      comment: replyText,
      createdAt: new Date(),
    };

    comment.replies.push(reply);

    // Save the updated comment with the new reply
    const updatedComment = await comment.save({ session });

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

export const replyServices = {
  addReplyToComment,
};
