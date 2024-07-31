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

export const userControllers = {
  handleCreateUser,
  handleGetAllUsers,
};
