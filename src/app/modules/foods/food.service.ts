import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodData } from "./food.interface";
import FoodModel from "./food.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

const createFood = async (payload: TFoodData) => {
  const result = await FoodModel.create(payload);
  return result;
};

const getSingleFood = async (id: string) => {
  const result = FoodModel.findById(id);
  return result;
};

const getTopSellingFood = async (query: Record<string, unknown>) => {
  const result = new QueryBuilder(FoodModel.find(), query)
    .search(["foodName"])
    .filter()
    .sort()
    .paginate();

  return await result.modelQuery;
};

const getAllFoods = async (query: Record<string, unknown>) => {
  const result = new QueryBuilder(FoodModel.find(), query)
    .search(["foodName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  return await result.modelQuery;
};





const updateFood = async (foodId:string,file: any, payload: TFoodData) => {
  const session = await mongoose.startSession();

  // Begin transaction
  session.startTransaction();

  try {

    let img:string =''
    if (file) {
      const imageName = `${payload.foodName}_${payload.food_origin}`;
      const path = file.path;

      // Send image to cloud storage and retrieve URL
      const { secure_url } = await sendImageToCloudinary(imageName, path);
      payload.foodImage = secure_url as string;
      img = secure_url as string
    }    
    
    const updatedFoodData = await FoodModel.findOneAndUpdate(
      { _id: foodId },
      { ...payload },
      { new: true, session } 
    );


    
    await session.commitTransaction();
    return {updatedFoodData,img}; 
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error creating blog:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

export const foodServices = {
  createFood,
  getSingleFood,
  getTopSellingFood,
  getAllFoods,
  updateFood
};
