import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CommentService } from "./comment.service";

const createComment = catchAsync(async (req, res) => {
  // const userId = req.body.user
  const userId = req.user.userId;
  const result = await CommentService.createComment(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment is created successfully",
    data: result,
  });
});

const findCommentById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CommentService.findCommentById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment is retrieved successfully",
    data: result,
  });
});

const getAllComments = catchAsync(async (req, res) => {
  const result = await CommentService.getAllComments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments are retrieved successfully",
    // meta: result.meta,
    data: result.data,
  });
});

const getAllCommentsOnSingleBlog = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const result = await CommentService.getAllCommentsOnSingleBlog(
    blogId,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Comments on single post are retrieved successfully",
    // meta: result.meta,
    data: result.data,
  });
});

const updateCommentById = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.user;

  
  const result = await CommentService.updateCommentById(
    userId,
    commentId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment is updated successfully",
    data: result,
  });
});

const deleteCommentById = catchAsync(async (req, res) => {
  const { commentId } = req.params;

  const result = await CommentService.deleteCommentById(commentId, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment is deleted successfully",
    data: result && null,
  });
});

const addReplyToComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body; // The reply text
  const userId = req.user.userId; // Assuming `auth` middleware sets `req.user`

  const result = await CommentService.addReplyToComment(
    commentId,
    userId,
    comment
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Reply added to comment successfully",
    data: result,
  });
});

export const CommentController = {
  createComment,
  findCommentById,
  getAllComments,
  getAllCommentsOnSingleBlog,
  updateCommentById,
  deleteCommentById,
  addReplyToComment,
};
