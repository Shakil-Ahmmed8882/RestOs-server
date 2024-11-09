import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";

import bcryptJs from "bcryptjs";

import jwt, { JwtPayload } from "jsonwebtoken";

import mongoose from "mongoose";

import { TLoginUser } from "./auth.interface";
import UserModel from "../user/user.model";
import { createToken, verifyToken } from "./auth.utils";
import { demoProfileUrl } from "../../shared";
import { USER_ROLE } from "../../constants";
import { sendEmail } from "../../utils/sendEmail";

const loginUser = async (payload: TLoginUser) => {
  // checking if the user is exist
  const user = await UserModel.findOne({ email: payload.email });

  if (!user) {
    const userData = {
      ...payload,
      photo: payload.photo || demoProfileUrl,
    };
    const user = await createUser(userData);

    const jwtPayload = {
      userId: user?._id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      photo: user?.photo as string,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string
    );

    return {
      accessToken,
      refreshToken,
    };
  } else {
    if (payload.password && user.password) {
      const isPasswordMatched = await bcryptJs.compare(
        payload.password,
        user?.password
      );

      if (!isPasswordMatched) {
        throw new AppError(httpStatus.NOT_FOUND, "Password Incorrect!");
      }
    }

    const jwtPayload = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo as string,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string
    );

    return {
      accessToken,
      refreshToken,
    };
  }
  // checking if the user is already deleted
};

const refreshToken = async (token: string) => {
  // checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const { email } = decoded;

  // checking if the user is exist
  const user = await UserModel.findOne({ email: email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
  }

  const jwtPayload = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo: user.photo as string ,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
  };
};

const registerUser = async (userData: TLoginUser) => {
  // post and record it as analytics
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // when select manual signup there must be passoword
    const existedUser = await UserModel.findOne({ email: userData.email });

    if (existedUser) {
      throw new Error("User already exist using this same email.");
    }
    if (userData.password) {
      // if manual sign up there is password & hash it
      userData.password = await bcryptJs.hash(
        userData.password,
        Number(config.bcrypt_salt_rounds)
      );
    }

    // if social sign up - create user without password

    const DBcreatedUser = await UserModel.create(
      [
        {
          ...userData,
          photo: userData.photo || demoProfileUrl,
          role: USER_ROLE.USER,
        },
      ],
      { session }
    );

    const createdUser = DBcreatedUser[0];
    if (createdUser?._id) {
      const jwtPayload = {
        userId: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        photo: createdUser.photo as string,
      };

      const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
      );

      const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
      );

      await session.commitTransaction();
      await session.endSession();

      return {
        accessToken,
        refreshToken,
      };
    }
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    console.error("Transaction aborted:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

const createUser = async (userData: TLoginUser) => {
  if (userData.password) {
    userData.password = await bcryptJs.hash(
      userData.password,
      Number(config.bcrypt_salt_rounds)
    );
  }
  const user = await UserModel.create({
    ...userData,
    role: USER_ROLE.USER,
  });

  return user;
};

const forgetPassword = async (userId: string) => {
  // checking if the user is exist
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked ! !");
  }

  const jwtPayload = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo: user.photo as string,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    "10m"
  );

  const resetUILink = `${config.reset_pass_ui_link}?id=${user._id}&token=${resetToken} `;

  sendEmail(user.email, resetUILink);
};

const resetPassword = async (
  payload: { userId: string; newPassword: string },
  token: string
) => {
  // checking if the user is exist
  const user = await UserModel?.findById(payload?.userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
  }
  // checking if the user is already deleted

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked ! !");
  }

  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string
  ) as JwtPayload;

  if (payload.userId !== decoded.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are forbidden!");
  }

  //hash new password
  const newHashedPassword = await bcryptJs.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await UserModel.findOneAndUpdate(
    {
      _id: decoded.userId,
      role: decoded.role,
    },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    }
  );
};

export const AuthServices = {
  loginUser,
  refreshToken,
  registerUser,
  resetPassword,
  forgetPassword,
};
