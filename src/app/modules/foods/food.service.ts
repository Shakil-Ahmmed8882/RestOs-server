import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodData } from "./food.interface";
import FoodModel from "./food.model";

const createFood = async (payload: TFoodData) => {
  const result = await FoodModel.create(payload);
  return result;
};

const getAllFoods = async (query: Record<string, unknown>) => {
  const result = new QueryBuilder(FoodModel.find(), query).search(['foodName']);
  return await result.modelQuery;
};

export const foodServices = {
  createFood,
  getAllFoods,
};
