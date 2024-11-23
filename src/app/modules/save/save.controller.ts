import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { saveServices } from "./save.service";

/**
 * Save a blog post
 */
const saveBlog = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.userId;

  const result = await saveServices.saveBlog(userId, blogId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post saved successfully",
    data: result,
  });
});

/**
 * Unsave a blog post
 */
const unsaveBlog = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.userId;

  const result = await saveServices.unsaveBlog(userId, blogId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post unsaved successfully",
    data: result,
  });
});

/**
 * Get all saved blog posts for a user
 */
const getUserSavedBlogs = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const result = await saveServices.getUserSavedBlogs(userId,req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrieved all saved blog posts successfully",
    meta: result.meta,
    data: result.data,
  });
});

/**
 * Check if a specific blog post is saved by the user
 */
const isBlogSavedByUser = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.userId;

  const isSaved = await saveServices.isBlogSavedByUser(userId, blogId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checked if blog post is saved by user",
    data: { isSaved },
  });
});

export const saveControllers = {
  saveBlog,
  unsaveBlog,
  getUserSavedBlogs,
  isBlogSavedByUser,
};
