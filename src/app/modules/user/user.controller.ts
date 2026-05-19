import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";
import { userAnalyticsService } from "./user.analytics.service";
import AppError from "../../errors/AppError";

const handleCreateUser = catchAsync(async (req, res) => {
  const userData = req.body;
  const file = req.file;
  const result = await userServices.createUser(userData, file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const handleGetAllUsers = catchAsync(async (req, res) => {
  const result = await userServices.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "retrieved all users successfully",
    data: result,
  });
});

const HandleGetSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await userServices.getSingleUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Retrieved single user successfully",
    data: result,
  });
});

const handleUpdateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { userId: authenticatedUserId } = req.user;

  if (userId !== authenticatedUserId) {
    throw new AppError(httpStatus.FORBIDDEN, "You can only update your own profile");
  }

  const result = await userServices.updateUser(userId, req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Update user data successfully",
    data: result,
  });
});
const handleDeleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { userId: authenticatedUserId } = req.user;

  if (userId !== authenticatedUserId) {
    throw new AppError(httpStatus.FORBIDDEN, "You can only delete your own account");
  }

  const result = await userServices.deleteUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "delete user data successfully",
    data: result,
  });
});

const handleUpdateUserRoleAndStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;

  const result = await userServices.updateUserRoleAndStatus(userId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role and status updated successfully",
    data: result,
  });
});

const resolveSelfId = (req: any): string => {
  return req.user?.userId || req.user?._id;
};

const parseDays = (raw: unknown): number => {
  const n = parseInt(String(raw ?? ""), 10);
  if (!n || Number.isNaN(n)) return 30;
  return Math.min(Math.max(n, 7), 365);
};

const handleGetMyAnalytics = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Not authenticated");
  }
  const days = parseDays(req.query.days);
  const data = await userAnalyticsService.getForUser(userId, days);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your analytics retrieved successfully",
    data,
  });
});

const handleGetUserAnalytics = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const days = parseDays(req.query.days);
  const data = await userAnalyticsService.getForUser(userId, days);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User analytics retrieved successfully",
    data,
  });
});

export const userControllers = {
  handleCreateUser,
  handleGetAllUsers,
  HandleGetSingleUser,
  handleUpdateUser,
  handleDeleteUser,
  handleUpdateUserRoleAndStatus,
  handleGetMyAnalytics,
  handleGetUserAnalytics,
};
