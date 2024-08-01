import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderServiices } from "./order.service";

const handleCreateOrder = catchAsync(async (req, res) => {
  const order = req.body;
  const result = await OrderServiices.createOrder(order);
  

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is create successfully",
    data: result,
  });
});

const handleGetSingleOrder = catchAsync(async (req, res) => {
  const { foodId } = req.params;
  const result = await OrderServiices.getSingleOrder(foodId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is retrieved successfully",
    data: result,
  });
});
const handleGetAllOrders = catchAsync(async (req, res) => {
  const result = await OrderServiices.getAllOrders(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "retrieved all Orders successfully",
    data: result,
  });
});

export const orderControllers = {
  handleCreateOrder,
  handleGetSingleOrder,
  handleGetAllOrders,
};
