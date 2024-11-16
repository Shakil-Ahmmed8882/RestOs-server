import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { foodServices } from "./food.service";

const handleCreateFood = catchAsync(async (req, res) => {
  const newFood = req.body;
  const file = req.file;

  const result = await foodServices.createFood(file, newFood);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Food created successfully",
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
    data: result.data,
    meta: result.meta,
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



const handleUpdateFood = catchAsync(async (req, res) => {
  const updatedFood = req.body;
  const file = req.file;
  const {foodId} = req.params;

  const result = await foodServices.updateFood(foodId,file, updatedFood);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Food Updated successfully",
    data: result,
  });
});


const handleDeleteFood = catchAsync(async (req, res) => {
  const {foodId} = req.params;

  const result = await foodServices.deleteFood(foodId);


  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Food deleted successfully",
    data: result,
  });
});

export const foodControllers = {
  handleCreateFood,
  handleGetSingleFood,
  handleGetAllFoods,
  handleGetTopFoods,
  handleUpdateFood,
  handleDeleteFood
};
