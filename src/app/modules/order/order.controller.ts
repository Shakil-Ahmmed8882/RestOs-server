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
    message: 'Student are retrieved succesfully',
    data: result,
  });
});
const handleDeleteOrder = catchAsync(async (req, res) => {
  const { orderId, email } = req.params;
  const result = await OrderServiices.deleteOrder(orderId, email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is deleted successfully",
    data: result,
  });
});

// Add this function to your existing order.controller.ts file
const handleGetOrderSummary = catchAsync(async (req, res) => {
  const { email } = req.params; // Extract email from the request parameters

  // Call the service method to get the order summary
  const summary = await OrderServiices.getOrderSummaryByEmail(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order summary retrieved successfully",
    data: summary,
  });
});



export const orderControllers = {
  handleCreateOrder,
  handleGetSingleOrder,
  handleGetAllOrders,
  handleDeleteOrder,
  handleGetOrderSummary
};
