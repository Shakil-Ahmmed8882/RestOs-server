import QueryBuilder from "../../builder/QueryBuilder";
import { Comment } from "./comment.model";
import { IComment } from "./comment.interface";
import httpStatus from "http-status";

// import { JwtPayload } from 'jsonwebtoken';
// import createAnalyticsRecord from '../../utils/createAnalyticsRecord';
import mongoose, { Mongoose } from "mongoose";
import { USER_STATUS } from "../../constants";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import BlogModel from "../blog/blog.model";
import { JwtPayload } from "jsonwebtoken";

const createComment = async (userId: string, comment: IComment) => {
  // post and record it as analytics
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "This User is not found");
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Can't comment as this user is already blocked"
      );
    }

    const blog = await BlogModel.findById(comment.blog);

    if (!blog) {
      throw new AppError(httpStatus.NOT_FOUND, " This blog is not found");
    }

    if (blog.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, " This blog is deleted");
    }

    await BlogModel.findByIdAndUpdate(
      comment.blog,
      { $inc: { commentsCount: 1 } },
      { session }
    );
    const commentResult = await Comment.create([{ ...comment, user: userId }], {
      session,
    });

    // if (commentResult.length > 0) {
    //   await createAnalyticsRecord(
    //     {
    //       post: commentResult[0]._id.toString(),
    //       user: new Types.ObjectId(userId),
    //       actionType: 'comment',
    //     },
    //     session,
    //   );
    // }

    await session.commitTransaction();
    await session.endSession();
    return commentResult;
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    console.error("Transaction aborted:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const findCommentById = async (commentId: string) => {
  return await Comment.findById(commentId);
};

const getAllComments = async (query: Record<string, unknown>) => {
  const commentQuery = new QueryBuilder(Comment.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await commentQuery.modelQuery;
  const metaData = await commentQuery.countTotal();
  return {
    meta: metaData,
    data: result,
  };
};

const getAllCommentsOnSingleBlog = async (
  blogId: string,
query: Record<string, unknown>
) => {
  const commentQuery = new QueryBuilder(
    Comment.find({ blog: new mongoose.Types.ObjectId(blogId) }),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await commentQuery.modelQuery
    .populate({
      path: "user",
      select: "name profile email photo",
    })

  const metaData = await commentQuery.countTotal();
  return {
    meta: metaData,
    data: result,
  };
};

const updateCommentById = async (
  userId: string,
  commentId: string,
  payload: Partial<IComment>
) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found");
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(httpStatus.CONFLICT, "Opps!! This is user is blocked");
  }

  const comment = await Comment.findById(commentId);
  
  if (!comment) {
    throw new AppError(httpStatus.NOT_FOUND, "This comment is not found");
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Opps! You can't edit someone else's comment."
    );
  }

  const result = await Comment.findByIdAndUpdate(commentId, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteCommentById = async (commentId: string, user: JwtPayload) => {
  // post and record it as analytics
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const comment = await Comment.findById(commentId);

    // Check if the user is admin or the author of the post
    const isAuthorized =
      user.role === "ADMIN" ||
      comment.user.toString() === user.userId.toString();
    if (!isAuthorized) {
      throw new Error("Not authorized to delete this comment");
    }

    await BlogModel.findByIdAndUpdate(comment.blog, {
      $inc: { commentsCount: -1 },
    }).session(session);
    const result = await Comment.findByIdAndDelete(commentId,{session});

    await session.commitTransaction();
    await session.endSession();
    return result[0];
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    console.error("Transaction aborted:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};



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
  } catch (error:any) {
    await session.abortTransaction();
    console.error("Transaction aborted:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};


export const CommentService = {
  createComment,
  findCommentById,
  getAllComments,
  getAllCommentsOnSingleBlog,
  updateCommentById,
  deleteCommentById,
  addReplyToComment
};
