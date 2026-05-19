import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { saveServices } from "./save.service";
import { TSaveType } from "./save.interface";

const resolveSelfId = (req: any): string => req.user?.userId || req.user?._id;

const assertType = (raw: string): TSaveType => {
  if (raw === "blog" || raw === "food") return raw;
  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Invalid save type "${raw}". Must be one of: blog, food.`
  );
};

const handleSaveItem = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const type = assertType(req.params.type);
  const { itemId } = req.params;

  const result = await saveServices.saveItem(userId, type, itemId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `${type} saved successfully`,
    data: result,
  });
});

const handleUnsaveItem = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const type = assertType(req.params.type);
  const { itemId } = req.params;

  const result = await saveServices.unsaveItem(userId, type, itemId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${type} unsaved successfully`,
    data: result,
  });
});

const handleIsItemSaved = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const type = assertType(req.params.type);
  const { itemId } = req.params;

  const isSaved = await saveServices.isItemSaved(userId, type, itemId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checked if item is saved",
    data: { isSaved, type, itemId },
  });
});

const handleGetMySaves = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const result = await saveServices.getMySaves(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Saved items retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const handleGetMySavesCounts = catchAsync(async (req, res) => {
  const userId = resolveSelfId(req);
  const data = await saveServices.getMySavesCounts(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Saved counts retrieved successfully",
    data,
  });
});

export const saveControllers = {
  handleSaveItem,
  handleUnsaveItem,
  handleIsItemSaved,
  handleGetMySaves,
  handleGetMySavesCounts,
};
