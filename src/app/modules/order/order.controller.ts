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

const handleGetOrderSummaryOfSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const summary = await OrderServiices.getOrderSummaryOfSingleUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order summary retrieved successfully",
    data: summary,
  });
});

// "Me" endpoints — userId resolved from the JWT instead of the URL.
const resolveSelfId = (req: any): string => {
  return req.user?.userId || req.user?._id;
};

const handleGetMyOrders = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const result = await OrderServiices.getUserOrders(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your orders retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const handleGetMySummary = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const summary = await OrderServiices.getOrderSummaryOfSingleUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your order summary retrieved successfully",
    data: summary,
  });
});

const handleCancelMyPending = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const result = await OrderServiices.cancelUserPendingOrders(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Cancelled ${result.cancelled} pending orders`,
    data: result,
  });
});

// Admin / generic version of getUserOrders by explicit userId param
const handleGetUserOrders = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await OrderServiices.getUserOrders(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User orders retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const orderControllers = {
  handleCreateOrder,
  handleGetSingleOrder,
  handleGetAllOrders,
  handleDeleteOrder,
  handleGetOrderSummaryOfSingleUser,
  handleUpdateOrder,
  handleGetMyOrders,
  handleGetMySummary,
  handleCancelMyPending,
  handleGetUserOrders,
};
