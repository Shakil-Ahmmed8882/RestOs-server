// middleware/auth.ts

import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { USER_ROLE } from '../constants';
import AppError from '../errors/AppError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import UserModel from '../modules/user/user.model';

// Utility to validate token and fetch user
const validateTokenAndFetchUser = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
  }

  // Verify the token
  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string,
  ) as JwtPayload;

  const { email } = decoded;

  // Check if the user exists
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found! (auth)');
  }

  return {
    decoded,
    user,
  };
};

const auth = (...requiredRoles: (keyof typeof USER_ROLE)[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    const { decoded } = await validateTokenAndFetchUser(token!);
    const decodedRole = decoded.role;

    if (requiredRoles.length && !requiredRoles.includes(decodedRole)) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    // Attach the user and role to the request object for further use
    req.user = {
      ...decoded,
      role: decoded.role,
      userId: decoded.userId,
    };

    next();
  });
};

export default auth;
