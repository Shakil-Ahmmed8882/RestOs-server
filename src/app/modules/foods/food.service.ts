import QueryBuilder from "../../builder/QueryBuilder";
import { TFoodData } from "./food.interface";
import FoodModel from "./food.model";

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
    .paginate();
  return await result.modelQuery;
};

export const foodServices = {
  createFood,
  getSingleFood,
  getTopSellingFood,
  getAllFoods,
};
