import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";

const handleCreateUser = catchAsync(async (req, res) => {
  const user = req.body;
  const result = await userServices.createUser(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is created successfully",
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
  const { userId } = req.user;
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
  const result = await userServices.updateUser(userId, req.body);


  

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Update user data successfully",
    data: result,
  });
});
const handleDeleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await userServices.deleteUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "delete user data successfully",
    data: result,
  });
});

export const userControllers = {
  handleCreateUser,
  handleGetAllUsers,
  HandleGetSingleUser,
  handleUpdateUser,
  handleDeleteUser
};
