import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";
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

export const userControllers = {
  handleCreateUser,
  handleGetAllUsers,
  HandleGetSingleUser,
  handleUpdateUser,
  handleDeleteUser,
  handleUpdateUserRoleAndStatus,
};
