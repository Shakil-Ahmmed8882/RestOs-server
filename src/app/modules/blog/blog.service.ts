import QueryBuilder from "../../builder/QueryBuilder";
import BlogModel from "./blog.model";
import { IBlog } from "./blog.interface";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { searchableFields } from "./blog.constant";
import mongoose from "mongoose";
import createAnalyticsRecord from "../analytics/analytics.service";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createBlog = async (file: any, payload: IBlog) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {
    if (file) {
      const imageName = `${payload.author.name}_${payload.title}`;
      const path = file.path;

      // Send image to cloud storage and retrieve URL
      const { secure_url } = await sendImageToCloudinary(imageName, path);
      payload.image = secure_url as string;
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
      session
    );

    
    await session.commitTransaction();
    return blogData;
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error creating blog:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Get all blogs with query options
const getAllBlogs = async (query: Record<string, unknown>) => {
  // Check if 'user' is provided in the query and add it to the query object
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

// Get a single blog by ID
const getBlogById = async (id: string) => {
  const blog = await BlogModel.findById(id);
  if (!blog) throw new Error("Blog not found");
  return blog;
};

// Update a blog by ID
const updateBlogById = async (id: string, payload: Partial<IBlog>) => {
  const existingBlog = await BlogModel.findById(id);
  if (!existingBlog) throw new Error("Blog not found");

  return await BlogModel.findByIdAndUpdate(id, payload, { new: true });
};

// Delete a blog by ID
const deleteBlogById = async (id: string) => {
  const blog = await BlogModel.findById(id);
  if (!blog) throw new Error("Blog not found");
  return await BlogModel.findByIdAndDelete(id);
};

export const blogServices = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlogById,
  deleteBlogById,
};
