import QueryBuilder from "../../builder/QueryBuilder";
import { Comment } from "./comment.model";
import { IComment } from "./comment.interface";
import httpStatus from "http-status";

import mongoose, { Types } from "mongoose";
import { USER_STATUS } from "../../constants";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import BlogModel from "../blog/blog.model";
import { JwtPayload } from "jsonwebtoken";
import createAnalyticsRecord from "../analytics/analytics.service";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../media-management";

const USER_SAFE_FIELDS = "_id name email photo role status";

const populateComment = (commentId: Types.ObjectId | string) =>
  Comment.findById(commentId)
    .populate({ path: "user", select: USER_SAFE_FIELDS })
    .populate({ path: "replies.user", select: USER_SAFE_FIELDS });

const createComment = async (
  userId: string,
  comment: IComment,
  file?: Express.Multer.File
) => {
  const session = await mongoose.startSession();
  let uploadedPublicIdForRollback: string | undefined;
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

    let image: string | null = null;
    let imagePublicId: string | null = null;
    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "comments",
        publicId: `comment-${userId}-${Date.now()}`,
      });
      image = uploaded.url;
      imagePublicId = uploaded.public_id;
      uploadedPublicIdForRollback = uploaded.public_id;
    }

    await BlogModel.findByIdAndUpdate(
      comment.blog,
      { $inc: { commentsCount: 1 } },
      { session }
    );
    const commentResult = await Comment.create(
      [
        {
          blog: comment.blog,
          comment: comment.comment,
          user: userId,
          image,
          imagePublicId,
        },
      ],
      { session }
    );

    if (commentResult.length > 0) {
      await createAnalyticsRecord(
        {
          userName: user?.name,
          resourceName: blog.title,
          description: `${user.name} commented on ${blog.title}`,
          blog: commentResult[0]._id.toString(),
          user: new Types.ObjectId(userId),
          actionType: "comment",
        },
        session
      );
    }

    await session.commitTransaction();
    return await populateComment(commentResult[0]._id);
  } catch (error: any) {
    await session.abortTransaction();
    if (uploadedPublicIdForRollback) {
      await deleteFromCloudinary(uploadedPublicIdForRollback);
    }
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
  const commentQuery = new QueryBuilder(
    Comment.find()
      .populate({ path: "user", select: USER_SAFE_FIELDS })
      .populate({ path: "replies.user", select: USER_SAFE_FIELDS }),
    query
  )
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
    .populate({ path: "user", select: USER_SAFE_FIELDS })
    .populate({ path: "replies.user", select: USER_SAFE_FIELDS });

  const metaData = await commentQuery.countTotal();
  return {
    meta: metaData,
    data: result,
  };
};

const updateCommentById = async (
  userId: string,
  commentId: string,
  payload: Partial<IComment> & { removeImage?: boolean },
  file?: Express.Multer.File
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
      httpStatus.FORBIDDEN,
      "Opps! You can't edit someone else's comment."
    );
  }

  const { removeImage, ...rest } = payload;
  const update: Partial<IComment> = { ...rest };
  let oldPublicIdToDelete: string | null = null;

  if (file?.buffer) {
    const uploaded = await uploadToCloudinary({
      fileBuffer: file.buffer,
      folder: "comments",
      publicId: `comment-${userId}-${Date.now()}`,
    });
    update.image = uploaded.url;
    update.imagePublicId = uploaded.public_id;
    oldPublicIdToDelete = comment.imagePublicId ?? null;
  } else if (removeImage) {
    update.image = null;
    update.imagePublicId = null;
    oldPublicIdToDelete = comment.imagePublicId ?? null;
  }

  const result = await Comment.findByIdAndUpdate(commentId, update, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "user", select: USER_SAFE_FIELDS })
    .populate({ path: "replies.user", select: USER_SAFE_FIELDS });

  if (oldPublicIdToDelete) {
    await deleteFromCloudinary(oldPublicIdToDelete);
  }

  return result;
};

const deleteCommentById = async (commentId: string, user: JwtPayload) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
    }

    const isAuthorized =
      user.role === "ADMIN" ||
      comment.user.toString() === user.userId.toString();
    if (!isAuthorized) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Not authorized to delete this comment"
      );
    }

    await BlogModel.findByIdAndUpdate(comment.blog, {
      $inc: { commentsCount: -1 },
    }).session(session);
    const result = await Comment.findByIdAndDelete(commentId, { session });

    await session.commitTransaction();

    if (comment.imagePublicId) {
      await deleteFromCloudinary(comment.imagePublicId);
    }

    return result;
  } catch (error: any) {
    await session.abortTransaction();
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
    await comment.save({ session });

    await session.commitTransaction();
    return await populateComment(comment._id);
  } catch (error: any) {
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
  addReplyToComment,
};
