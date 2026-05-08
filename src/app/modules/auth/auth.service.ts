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
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

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

const registerUser = async (userData: TLoginUser, file?: Express.Multer.File) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existedUser = await UserModel.findOne({ email: userData.email });

    if (existedUser) {
      throw new Error("User already exist using this same email.");
    }

    let photoUrl = demoProfileUrl;

    // Handle image upload if file is provided
    if (file) {
      const uploadedImage = await sendImageToCloudinary(
        `user-${userData.email}-${Date.now()}`,
        file.path
      );
      photoUrl = (uploadedImage as any).secure_url;
    }

    if (userData.password) {
      userData.password = await bcryptJs.hash(
        userData.password,
        Number(config.bcrypt_salt_rounds)
      );
    }

    const DBcreatedUser = await UserModel.create(
      [
        {
          ...userData,
          photo: photoUrl,
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
        user: {
          userId: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          photo: createdUser.photo,
        },
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

const forgetPassword = async (email: string) => {
  // checking if the user is exist
  const user = await UserModel.findOne({ email });

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

  const resetUILink = `${config.reset_pass_ui_link}?id=${user._id}&token=${resetToken}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${user.name},
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
          You requested a password reset. Click the button below to reset your password. This link will expire in <strong>10 minutes</strong>.
        </p>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${resetUILink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 12px; margin-bottom: 15px;">
          Or copy and paste this link in your browser:
        </p>
        <p style="color: #007bff; font-size: 12px; word-break: break-all; margin-bottom: 30px;">
          ${resetUILink}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin-bottom: 10px;">
          If you didn't request this password reset, please ignore this email.
        </p>
        <p style="color: #999; font-size: 12px;">
          For security, never share this link with anyone.
        </p>
      </div>
      <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
        © RestOS. All rights reserved.
      </p>
    </div>
  `;

  try {
    await sendEmail(user.email, emailHtml);
    console.log('✅ Password reset email sent to:', user.email);
  } catch (error: any) {
    console.error('❌ Failed to send reset email:', error.message);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send reset email. Please try again.'
    );
  }
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
