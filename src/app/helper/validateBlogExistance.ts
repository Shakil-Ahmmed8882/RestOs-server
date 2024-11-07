import httpStatus from "http-status";
import BlogModel from "../modules/blog/blog.model";
import AppError from "../errors/AppError";
import { IBlog } from "../modules/blog/blog.interface";

/**
 * Helper function to check if a blog exists
 * @param blogId - Blog ID
 * @returns Promise<void>
 */
const validateBlogExistence = async (blogId: string): Promise<IBlog> => {
  const blog = await BlogModel.findById(blogId);
  if (!blog) {
    throw new AppError(httpStatus.NOT_FOUND, "Oops! Blog not found!!!");
  }
  return blog
};

export default validateBlogExistence;
