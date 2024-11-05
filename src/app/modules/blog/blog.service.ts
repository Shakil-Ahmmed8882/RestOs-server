import QueryBuilder from "../../builder/QueryBuilder";
import BlogModel from "./blog.model";
import { IBlog } from "./blog.interface";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { searchableFields } from "./blog.constant";

// Create a new blog
const createBlog = async (file: any, payload: IBlog) => {
  try {
    if (file) {
      const imageName = `${payload.author}${payload?.title}`;
      const path = file?.path;

      //send image to cloudinary
      const { secure_url } = await sendImageToCloudinary(imageName, path);
      payload.image = secure_url as string;
    }

    const blogData = await BlogModel.create(payload);
    return blogData;
  } catch (error: any) {
    console.log(error.message);
  }
};

// Get all blogs with query options
const getAllBlogs = async (query: Record<string, unknown>) => {
  const blogQuery = new QueryBuilder(BlogModel.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate();
    
    const result = await blogQuery.modelQuery.populate("author.user");

    
    console.log("_________________________________")

    console.log("url",query)
    console.log({result})
  return result;
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
