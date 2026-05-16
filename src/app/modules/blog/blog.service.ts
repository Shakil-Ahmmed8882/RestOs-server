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

export const blogServices = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlogById,
  deleteBlogById,
};
