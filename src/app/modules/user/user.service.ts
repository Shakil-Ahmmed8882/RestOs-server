import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TUser } from "./user.interface";
import UserModel from "./user.model";
import mongoose from "mongoose";
import {
  updateArrayField,
  updateNestedFields,
} from "../../helper/update.helper";
import validateUserAndStatus from "../../helper/validateUserStatus";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../media-management";

const buildUserPublicId = (email: string) =>
  `user-${email.replace(/[^a-zA-Z0-9_\-]/g, "_")}`;

const createUser = async (payload: TUser, file?: Express.Multer.File) => {
  const existingUser = await UserModel.findOne({ email: payload.email });
  if (existingUser) throw new AppError(httpStatus.CONFLICT, "User already exists with this email");

  const userData = { ...payload };

  if (file?.buffer) {
    const uploaded = await uploadToCloudinary({
      fileBuffer: file.buffer,
      folder: "users",
      publicId: buildUserPublicId(payload.email),
    });
    userData.photo = uploaded.url;
    userData.photoPublicId = uploaded.public_id;
  }

  const bcryptJs = require("bcryptjs");
  const hashedPassword = await bcryptJs.hash(
    payload.password,
    Number(process.env.BCRYPT_SALT_ROUNDS || 10)
  );
  userData.password = hashedPassword;

  const result = await UserModel.create(userData);
  return result;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const userModelQuery = new QueryBuilder(UserModel.find(), query).search([
    "name",
    "email",
    "contactNumber",
  ]).fields().filter().paginate();
  const result = await userModelQuery.modelQuery;
  const meta = await userModelQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getSingleUser = async (userId: string) => {
  const user = await validateUserAndStatus(userId);
  return user;
};

const updateUser = async (userId: string, payload: Partial<TUser>, file?: Express.Multer.File) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  // Track the new public_id outside the txn so we can roll it back if the DB write fails.
  let newlyUploadedPublicId: string | undefined;
  let oldPublicIdToDelete: string | undefined;

  try {
    const existingUserData = await UserModel.findById(userId).session(session);
    if (!existingUserData) {
      await session.abortTransaction();
      throw new AppError(httpStatus.NOT_FOUND, "Oops! User is not found!");
    }

    const {
      cuisinePreferences,
      favoriteRestaurants,
      dietaryRestrictions,
      preferredMealTimes,
      paymentMethods,
      socialMedia = {},
      ...rest
    } = payload;

    const modifiedFieldspdata: Record<string, string | undefined> = {};
    const modifiedArrayData: Record<string, any[]> = {};

    if (file?.buffer) {
      const uploaded = await uploadToCloudinary({
        fileBuffer: file.buffer,
        folder: "users",
        publicId: `user-${userId}`,
        overwrite: true,
      });
      modifiedFieldspdata.photo = uploaded.url;
      modifiedFieldspdata.photoPublicId = uploaded.public_id;
      newlyUploadedPublicId = uploaded.public_id;

      // Only schedule deletion of old asset if it has a different public_id.
      if (
        existingUserData.photoPublicId &&
        existingUserData.photoPublicId !== uploaded.public_id
      ) {
        oldPublicIdToDelete = existingUserData.photoPublicId;
      }
    }

    if (socialMedia && Object.keys(socialMedia).length > 0) {
      for (const [key, value] of Object.entries(socialMedia)) {
        modifiedFieldspdata[`socialMedia.${key}`] = value;
      }
    }

    updateNestedFields("socialMedia", socialMedia, modifiedFieldspdata);
    updateArrayField("cuisinePreferences", cuisinePreferences, modifiedArrayData);
    updateArrayField("favoriteRestaurants", favoriteRestaurants, modifiedArrayData);
    updateArrayField("dietaryRestrictions", dietaryRestrictions, modifiedArrayData);
    updateArrayField("preferredMealTimes", preferredMealTimes, modifiedArrayData);
    updateArrayField("paymentMethods", paymentMethods, modifiedArrayData);

    const result = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...rest,
        ...modifiedFieldspdata,
        ...modifiedArrayData,
      },
      { runValidators: true, new: true, session }
    );

    await session.commitTransaction();

    // DB is committed. Now safe to delete the orphaned old image.
    if (oldPublicIdToDelete) {
      await deleteFromCloudinary(oldPublicIdToDelete);
    }

    return result;
  } catch (error) {
    await session.abortTransaction();

    // Roll back the freshly uploaded asset since the DB write failed.
    if (newlyUploadedPublicId) {
      await deleteFromCloudinary(newlyUploadedPublicId);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const deleteUser = async (userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Soft delete only — keep the image so the user can be restored.
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true, session }
    );

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};


export const userServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser
};
