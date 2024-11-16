import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { foodCategoryServices } from "./foodCategory.service";

const handleCreateCategory = catchAsync(async (req, res) => {
  const file = req.file;
  const newCategory = req.body;

  const result = await foodCategoryServices.createCategory(file, newCategory);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const handleGetSingleCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const result = await foodCategoryServices.getSingleCategory(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category retrieved successfully",
    data: result,
  });
});

const handleGetAllCategories = catchAsync(async (req, res) => {
  const result = await foodCategoryServices.getAllCategories(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All categories retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const handleUpdateCategory = catchAsync(async (req, res) => {
  const updatedCategory = req.body;
  const { categoryId } = req.params;
  const file = req.file;

  const result = await foodCategoryServices.updateCategory(
    categoryId,
    file,
    updatedCategory
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const handleDeleteCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const result = await foodCategoryServices.deleteCategory(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

export const foodCategoryControllers = {
  handleCreateCategory,
  handleGetSingleCategory,
  handleGetAllCategories,
  handleUpdateCategory,
  handleDeleteCategory,
};
