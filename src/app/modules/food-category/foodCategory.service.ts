import mongoose from "mongoose";
import FoodCategoryModel from "./foodCategory.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodCategory } from "./foodCategory.interface";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../media-management";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const buildCategoryPublicId = (name: string) => `category-${name}`;

const createCategory = async (
  file: Express.Multer.File | undefined,
  payload: Partial<TFoodCategory>,
) => {
  const session = await mongoose.startSession();
  let uploadedPublicIdForRollback: string | undefined;
  session.startTransaction();

  try {
    if (file?.buffer && payload.name) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "categories",
        publicId: buildCategoryPublicId(payload.name),
      });
      payload.image = uploaded.url;
      payload.imagePublicId = uploaded.public_id;
      uploadedPublicIdForRollback = uploaded.public_id;
    }

    const createdCategory = await FoodCategoryModel.create([payload], { session });

    await session.commitTransaction();
    return { createdCategory };
  } catch (error: any) {
    await session.abortTransaction();
    if (uploadedPublicIdForRollback) {
      await deleteFromCloudinary(uploadedPublicIdForRollback);
    }
    console.error("Error creating category:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const getSingleCategory = async (id: string) => {
  return await FoodCategoryModel.findById(id);
};

const getAllCategories = async (query: Record<string, unknown>) => {
  const categoryQuery = new QueryBuilder(FoodCategoryModel.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate();

  const result = await categoryQuery.modelQuery;
  const meta = await categoryQuery.countTotal();

  return { data: result, meta };
};

const updateCategory = async (
  foodCategoryId: string,
  file: Express.Multer.File | undefined,
  payload: TFoodCategory,
) => {
  const session = await mongoose.startSession();
  let uploadedPublicIdForRollback: string | undefined;
  let oldPublicIdToDelete: string | undefined;
  session.startTransaction();

  try {
    const category = await FoodCategoryModel.findById(foodCategoryId).session(session);
    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, "Category not found !!");
    }

    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "categories",
        publicId: buildCategoryPublicId(payload.name ?? category.name),
      });
      payload.image = uploaded.url;
      payload.imagePublicId = uploaded.public_id;
      uploadedPublicIdForRollback = uploaded.public_id;

      if (category.imagePublicId && category.imagePublicId !== uploaded.public_id) {
        oldPublicIdToDelete = category.imagePublicId;
      }
    }

    const updatedFoodData = await FoodCategoryModel.findOneAndUpdate(
      { _id: foodCategoryId },
      { ...payload },
      { new: true, session },
    );

    await session.commitTransaction();

    if (oldPublicIdToDelete) {
      await deleteFromCloudinary(oldPublicIdToDelete);
    }

    return { updatedFoodData, img: updatedFoodData?.image ?? "" };
  } catch (error: any) {
    await session.abortTransaction();
    if (uploadedPublicIdForRollback) {
      await deleteFromCloudinary(uploadedPublicIdForRollback);
    }
    console.error("Error updating food category:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteCategory = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedCategory = await FoodCategoryModel.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    if (deletedCategory?.imagePublicId) {
      await deleteFromCloudinary(deletedCategory.imagePublicId);
    }

    return { deletedCategory };
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error deleting category:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

export const foodCategoryServices = {
  createCategory,
  getSingleCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
