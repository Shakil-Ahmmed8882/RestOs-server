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
  const { orderId } = req.params;
  const result = await OrderServiices.getSingleOrder(orderId);

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



const handleUpdateOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await OrderServiices.updateOrder(orderId,req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status is updated successfully",
    data: result,
  });
});



const handleDeleteOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await OrderServiices.deleteOrder(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is deleted successfully",
    data: result,
  });
});

// Add this function to your existing order.controller.ts file
const handleGetOrderSummaryOfSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params; 

  // Call the service method to get the order summary
  const summary = await OrderServiices.getOrderSummaryOfSingleUser(userId);

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
 handleGetOrderSummaryOfSingleUser,
 handleUpdateOrder
};
