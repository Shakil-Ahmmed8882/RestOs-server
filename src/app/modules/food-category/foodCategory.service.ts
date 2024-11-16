import mongoose from "mongoose";
import FoodCategoryModel from "./foodCategory.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodCategory } from "./foodCategory.interface";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createCategory = async (file: any, payload: Partial<TFoodCategory>) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {
    if (file) {
      const imageName = `${payload.name}`;
      const path = file.path;

      // Send image to cloud storage and retrieve URL
      const { secure_url } = await sendImageToCloudinary(imageName, path);
      payload.image = secure_url as string;
    }

    const createdCategory = await FoodCategoryModel.create([payload], {
      session,
    });

    await session.commitTransaction();
    return { createdCategory };
  } catch (error: any) {
    await session.abortTransaction();
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

  return {
    data: result,
    meta,
  };
};



const updateCategory = async (foodCategoryId: string, file: any, payload: TFoodCategory) => {
    const session = await mongoose.startSession();
  
    // Begin transaction
    session.startTransaction();
  
    try {


        const category = await FoodCategoryModel.findById(foodCategoryId)
        if(!category){
            throw new AppError(httpStatus.NOT_FOUND,"Category not found !!")
        }

      let img: string = "";
      if (file) {
        const imageName = `${payload.name}`;
        const path = file.path;
  
        // Send image to cloud storage and retrieve URL
        const { secure_url } = await sendImageToCloudinary(imageName, path);
        payload.image = secure_url as string;
        img = secure_url as string;
      }
  
      const updatedFoodData = await FoodCategoryModel.findOneAndUpdate(
        { _id: foodCategoryId },
        { ...payload },
        { new: true, session }
      );
  
      await session.commitTransaction();
      return { updatedFoodData, img };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error updating food category:", error.message);
      throw error;
    } finally {
      session.endSession();
    }
  };
  


const deleteCategory = async (id: string) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {
    const deletedCategory = await FoodCategoryModel.findByIdAndDelete(id, {
      session,
    });

    await session.commitTransaction();
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
