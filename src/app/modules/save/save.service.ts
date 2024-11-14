import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Save } from "./save.model";
import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import validateUserAndStatus from "../../helper/validateUserStatus";
import validateBlogExistence from "../../helper/validateBlogExistance";
import { saveBlogSearchableFields } from "./save.constant";
import createAnalyticsRecord from "../analytics/analytics.service";
import { ISave } from "./save.interface";

/**
 * Save a blog for a user with analytics recording and transaction
 * @param userId - User ID
 * @param blogId - Blog ID to save
 * @returns Promise<void>
 */
const saveBlog = async (userId: string, blogId: string): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await validateUserAndStatus(userId);
    const blog = await validateBlogExistence(blogId);

    const alreadySavedBlog = await Save.findOne({
      user: new mongoose.Types.ObjectId(userId),
      blog: new mongoose.Types.ObjectId(blogId),
    });

    if (alreadySavedBlog) {
      throw new AppError(httpStatus.CONFLICT, "Oops! Already saved!");
    }

    // Create and save a new record in the Save collection
    const result = await Save.create(
      [
        {
          name: blog.title,
          user: new mongoose.Types.ObjectId(userId),
          blog: new mongoose.Types.ObjectId(blogId),
        },
      ],
      { session }
    );

    // Record analytics for saving a blog
    if (result) {
      await createAnalyticsRecord(
        {
          name: blog.title,
          blog: new mongoose.Types.ObjectId(blogId),
          user: new mongoose.Types.ObjectId(userId),
          actionType: "save-blog",
        },
        session
      );
    }

    await session.commitTransaction();
    session.endSession();
    return result
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error saving blog:", error);
    throw new Error("Error saving blog");
  }
};

/**
 * Unsave a blog for a user with analytics recording and transaction
 * @param userId - User ID
 * @param blogId - Blog ID to unsave
 * @returns Promise<void>
 */
const unsaveBlog = async (userId: string, blogId: string): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await validateUserAndStatus(userId);
    const blog = await validateBlogExistence(blogId);

    const deletionResult = await Save.deleteOne(
      {
        user: new mongoose.Types.ObjectId(userId),
        blog: new mongoose.Types.ObjectId(blogId),
      },
      { session }
    );

    // Only record analytics if a document was actually deleted
    if (deletionResult.deletedCount > 0) {
      await createAnalyticsRecord(
        {
          name:blog.title,
          blog: new mongoose.Types.ObjectId(blogId),
          user: new mongoose.Types.ObjectId(userId),
          actionType: "unsave-blog",
        },
        session
      );
    }

    await session.commitTransaction();
    session.endSession();
    return deletionResult
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error unsaving blog:", error);
    throw new Error("Error unsaving blog");
  }
};

/**
 * Get all saved blogs for a user
 * @param userId - User ID
 * @returns Promise<Array<{ blog: mongoose.Types.ObjectId }>>
 */
const getUserSavedBlogs = async (
  userId: string,
  query: Record<string, unknown>
) => {
  try {
    await validateUserAndStatus(userId);

    const savedBlogQuery = new QueryBuilder(
      Save.find({ user: new mongoose.Types.ObjectId(userId) }),
      query
    )
      .search(saveBlogSearchableFields)
      .filter()
      .sort()
      .paginate();

    const savedBlogs = await savedBlogQuery.modelQuery
      .populate("user")
      .populate("blog");
    const meta = await savedBlogQuery.countTotal();

    return {
      meta,
      data: savedBlogs,
    };
  } catch (error) {
    console.error("Error fetching user saved blogs:", error);
    throw new Error("Error fetching user saved blogs");
  }
};

/**
 * Check if a blog is saved by a user
 * @param userId - User ID
 * @param blogId - Blog ID
 * @returns Promise<boolean>
 */
const isBlogSavedByUser = async (
  userId: string,
  blogId: string
): Promise<boolean> => {
  try {
    await validateUserAndStatus(userId);
    await validateBlogExistence(blogId);

    const savedBlog = await Save.findOne({
      user: new mongoose.Types.ObjectId(userId),
      blog: new mongoose.Types.ObjectId(blogId),
    });

    return !!savedBlog;
  } catch (error) {
    console.error("Error checking if blog is saved by user:", error);
    throw new Error("Error checking if blog is saved by user");
  }
};

// Export the save services
export const saveServices = {
  saveBlog,
  unsaveBlog,
  getUserSavedBlogs,
  isBlogSavedByUser,
};
