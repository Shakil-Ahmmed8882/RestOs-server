import QueryBuilder from "../../builder/QueryBuilder";
import BlogModel from "./blog.model";
import { IBlog } from "./blog.interface";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../media-management";
import { searchableFields } from "./blog.constant";
import mongoose from "mongoose";
import createAnalyticsRecord from "../analytics/analytics.service";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const buildBlogPublicId = (authorName: string, title: string) =>
  `blog-${authorName}-${title}-${Date.now()}`;

const createBlog = async (file: Express.Multer.File | undefined, payload: IBlog) => {
  const session = await mongoose.startSession();
  let uploadedPublicIdForRollback: string | undefined;
  session.startTransaction();

  try {
    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "blogs",
        publicId: buildBlogPublicId(payload.author.name, payload.title),
      });
      payload.image = uploaded.url;
      payload.imagePublicId = uploaded.public_id;
      uploadedPublicIdForRollback = uploaded.public_id;
    }

    const user = await UserModel.findById(payload.author.user).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "Opss! user is not found");
    }
    const blogData = await BlogModel.create([payload], { session });

    await createAnalyticsRecord(
      {
        resourceName: payload.title,
        userName: user?.name,
        blog: blogData[0]._id,
        description: `${user.name} Created a blog: ${payload.title}`,
        user: new mongoose.Types.ObjectId(payload.author.user),
        actionType: "blog",
      },
      session,
    );

    await session.commitTransaction();
    return blogData;
  } catch (error: any) {
    await session.abortTransaction();
    if (uploadedPublicIdForRollback) {
      await deleteFromCloudinary(uploadedPublicIdForRollback);
    }
    console.error("Error creating blog:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const getAllBlogs = async (query: Record<string, unknown>) => {
  if (query.user) {
    query["author.user"] = new mongoose.Types.ObjectId(`${query.user}`);
    delete query.user;
  }

  const blogQuery = new QueryBuilder(BlogModel.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate();

  const result = await blogQuery.modelQuery.populate("author.user");
  const meta = await blogQuery.countTotal();

  return { result, meta };
};

const getBlogById = async (id: string) => {
  const blog = await BlogModel.findById(id);
  if (!blog) throw new Error("Blog not found");
  return blog;
};

const updateBlogById = async (id: string, payload: Partial<IBlog>) => {
  const existingBlog = await BlogModel.findById(id);
  if (!existingBlog) throw new Error("Blog not found");

  return await BlogModel.findByIdAndUpdate(id, payload, { new: true });
};

const deleteBlogById = async (id: string) => {
  const blog = await BlogModel.findById(id);
  if (!blog) throw new Error("Blog not found");

  const deleted = await BlogModel.findByIdAndDelete(id);

  if (deleted?.imagePublicId) {
    await deleteFromCloudinary(deleted.imagePublicId);
  }

  return deleted;
};

/**
 * Paginated, filterable, searchable list of one user's own blogs. Filters
 * out soft-deleted blogs by default. Supports searchTerm, status filter,
 * sort, page, limit, fields via QueryBuilder.
 */
const getMyBlogs = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const baseFilter: Record<string, unknown> = {
    "author.user": new mongoose.Types.ObjectId(userId),
    isDeleted: { $ne: true },
  };

  // Let the caller opt-in to soft-deleted blogs (e.g. a "Trash" tab)
  if (query.includeDeleted === "true") {
    delete baseFilter.isDeleted;
    delete query.includeDeleted;
  }

  const blogQuery = new QueryBuilder(BlogModel.find(baseFilter), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await blogQuery.countTotal();
  const result = await blogQuery.modelQuery;
  return { meta, result };
};

/**
 * Per-status counts + lifetime engagement totals for one user's blogs.
 * Drives the tab badges (Pending/Approved/Test-approved) and the
 * "Blogger stats" dashboard card.
 */
const getMyBlogsStats = async (userId: string) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [rows, latest] = await Promise.all([
    BlogModel.aggregate([
      { $match: { "author.user": uid, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          upvotes: { $sum: "$upvotes" },
          downvotes: { $sum: "$downvotes" },
          commentsReceived: { $sum: "$commentsCount" },
        },
      },
    ]),
    BlogModel.find(
      { "author.user": uid, isDeleted: { $ne: true } },
      { title: 1, status: 1, upvotes: 1, downvotes: 1, commentsCount: 1, image: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const empty = { count: 0, upvotes: 0, downvotes: 0, commentsReceived: 0 };
  const byStatus: Record<string, typeof empty> = {
    pending: { ...empty },
    approved: { ...empty },
    "test-approved": { ...empty },
  };
  for (const r of rows) {
    if (r._id && byStatus[r._id]) {
      byStatus[r._id] = {
        count: r.count,
        upvotes: r.upvotes ?? 0,
        downvotes: r.downvotes ?? 0,
        commentsReceived: r.commentsReceived ?? 0,
      };
    }
  }

  const totalBlogs = rows.reduce((a, r) => a + r.count, 0);
  const totalUpvotes = rows.reduce((a, r) => a + (r.upvotes ?? 0), 0);
  const totalDownvotes = rows.reduce((a, r) => a + (r.downvotes ?? 0), 0);
  const totalCommentsReceived = rows.reduce(
    (a, r) => a + (r.commentsReceived ?? 0),
    0
  );

  return {
    totalBlogs,
    totalUpvotes,
    totalDownvotes,
    totalCommentsReceived,
    netVotes: totalUpvotes - totalDownvotes,
    byStatus,
    recent: latest,
  };
};

export const blogServices = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlogById,
  deleteBlogById,
  getMyBlogs,
  getMyBlogsStats,
};
