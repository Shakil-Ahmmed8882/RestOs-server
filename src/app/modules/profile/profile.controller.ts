import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { profileServices } from "./profile.service";
import { TProfileTab } from "./profile.interface";

const resolveUserId = (req: any) => req.params.userId ?? req.user?.userId;

const handleGetMyProfile = catchAsync(async (req, res) => {
  const result = await profileServices.getProfileOverview(req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My profile retrieved successfully",
    data: result,
  });
});

const handleGetUserProfile = catchAsync(async (req, res) => {
  const result = await profileServices.getProfileOverview(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const handleGetProfileStats = catchAsync(async (req, res) => {
  const userId = resolveUserId(req);
  const result = await profileServices.getProfileStats(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile stats retrieved successfully",
    data: result,
  });
});

const handleGetProfileContent = catchAsync(async (req, res) => {
  const userId = resolveUserId(req);
  const tab = (req.params.tab as TProfileTab) ?? "blogs";
  const result = await profileServices.getProfileContent(userId, tab, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Profile ${tab} retrieved successfully`,
    data: result,
  });
});

const handleUpdateMyProfile = catchAsync(async (req, res) => {
  const result = await profileServices.updateMyProfile(
    req.user.userId,
    req.body,
    req.file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const handleUpdatePreference = catchAsync(async (req, res) => {
  const { field, action, values } = req.body;
  const result = await profileServices.updatePreferenceArray(
    req.user.userId,
    field,
    action,
    values
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Preference updated successfully",
    data: result,
  });
});

export const profileControllers = {
  handleGetMyProfile,
  handleGetUserProfile,
  handleGetProfileStats,
  handleGetProfileContent,
  handleUpdateMyProfile,
  handleUpdatePreference,
};
