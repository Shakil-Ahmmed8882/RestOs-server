import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { blogServices } from "./blog.service";

// Controller to create a new blog
const handleCreateBlog = catchAsync(async (req, res) => {
  const blog = req.body;
  const file = req.file;

  const result = await blogServices.createBlog(file, blog);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog created successfully",
    data: result,
  });
});

// Controller to get all blogs with query options
const handleGetAllBlogs = catchAsync(async (req, res) => {
  const result = await blogServices.getAllBlogs(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All blogs retrieved successfully",
    data: result,
  });
});

// Controller to get a single blog by ID
const handleGetBlogById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await blogServices.getBlogById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog retrieved successfully",
    data: result,
  });
});

// Controller to update a blog by ID
const handleUpdateBlogById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await blogServices.updateBlogById(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog updated successfully",
    data: result,
  });
});

// Controller to delete a blog by ID
const handleDeleteBlogById = catchAsync(async (req, res) => {
  const { id } = req.params;
  await blogServices.deleteBlogById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {},
    message: "Blog deleted successfully",
  });
});

export const blogControllers = {
  handleCreateBlog,
  handleGetAllBlogs,
  handleGetBlogById,
  handleUpdateBlogById,
  handleDeleteBlogById,
};
