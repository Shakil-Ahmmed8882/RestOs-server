import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import { AuthServices } from './auth.service';
import sendResponse from '../../utils/sendResponse';
import config from '../../config';


const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body);
  const { refreshToken, accessToken, user } = result;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production'
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is logged in successfully!',
    data: {
      accessToken,
      refreshToken,
      user,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  
  console.log("_______________>>>>>>>>>>>>", refreshToken)
  const result = await AuthServices.refreshToken(refreshToken);


  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access token is retrieved successfully!',
    data: result,
  });
});
const registerUser = catchAsync(async (req, res) => {
  const result = await AuthServices.registerUser(req.body, req.file);

  res.cookie("refreshToken",result?.refreshToken,{
    httpOnly: true,
    secure: config.NODE_ENV === 'production'
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});



const forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthServices.forgetPassword(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reset link is generated succesfully!',
    data: result,
  });
});


const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await AuthServices.resetPassword(token, newPassword);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully!',
    data: result,
  });
});


export const AuthControllers = {
  loginUser,
  refreshToken,
  registerUser,
  resetPassword,
  forgetPassword
};
