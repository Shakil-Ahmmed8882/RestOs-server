import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { analyticsServices } from './analytics.service';




const getAllAnalytics = catchAsync(async (req, res) => {
  const result = await analyticsServices.getAllAnalytics(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All analytics are retrieved successfully',
    meta: result.meta, 
    data: result.data,
  });
});

const getAnalyticsSummaryMatrix = catchAsync(async (req, res) => {
  const result = await analyticsServices.getAnalyticsSummaryMatrix();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All user specific analytics matrix retrieved successfully',
    data: result,
  });
});


const getUserActionCounts = catchAsync(async (req, res) => {
  const userId = req.user.userId
  
  
  const result = await analyticsServices.getUserActionCounts(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All analytics matrix retrieved successfully',
    data: result,
  });
});


export const analyticControllers = {
  getAllAnalytics,
  getAnalyticsSummaryMatrix,
  getUserActionCounts
};