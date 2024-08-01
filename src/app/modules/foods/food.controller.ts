import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { foodServices } from "./food.service";

const handleCreateFood = catchAsync(async (req, res) => {
  const food = req.body;
  const result = await foodServices.createFood(food);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "food is create successfully",
    data: result,
  });
});

const handleGetSingleFood = catchAsync(async (req, res) => {
  const { foodId } = req.params;
  const result = await foodServices.getSingleFood(foodId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Food is retrieved successfully",
    data: result,
  });
});
const handleGetAllFoods = catchAsync(async (req, res) => {
  const result = await foodServices.getAllFoods(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "retrieved all foods successfully",
    data: result,
  });
});

const handleGetTopFoods = catchAsync(async (req, res) => {
  const result = await foodServices.getAllFoods(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "retrieved all foods successfully",
    data: result,
  });
});

export const foodControllers = {
  handleCreateFood,
  handleGetSingleFood,
  handleGetAllFoods,
  handleGetTopFoods
};
