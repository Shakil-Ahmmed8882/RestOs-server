import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { replyServices } from "./reply.service";

const handleAddReplyToComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;

  const userId = req.user.userId;

  const result = await replyServices.addReplyToComment(
    commentId,
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Reply added to comment successfully",
    data: result,
  });
});

// Update an existing reply
const handleUpdateReply = catchAsync(async (req, res) => {
  const { commentId, replyId } = req.params;
  const userId = req.user.userId;

  const result = await replyServices.updateReply(
    commentId,
    replyId,
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reply updated successfully",
    data: result,
  });
});

// Delete a reply
const handleDeleteReply = catchAsync(async (req, res) => {
  const { commentId, replyId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await replyServices.deleteReply(
    commentId,
    replyId,
    userId,
    userRole
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reply deleted successfully",
    data: result,
  });
});

export const replyControllers = {
  handleAddReplyToComment,
  handleUpdateReply,
  handleDeleteReply,
};
