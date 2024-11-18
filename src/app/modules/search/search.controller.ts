import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { globalSearchServices } from "./search.service";

const handleGlobalSearch = catchAsync(async (req, res) => {
  const data = await globalSearchServices.getGlobalSearchResults(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fetch all search results successfully!!",
    data: data.results,
    meta: data.meta,
  });
});

export const globalSearchControllers = {
  handleGlobalSearch,
};
