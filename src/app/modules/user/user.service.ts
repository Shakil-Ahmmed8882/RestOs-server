import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { socialMedia, TUser } from "./user.interface";
import UserModel from "./user.model";
import mongoose from "mongoose";
import {
  updateArrayField,
  updateNestedFields,
} from "../../helper/update.helper";
import validateUserAndStatus from "../../helper/validateUserStatus";
import { sendImageToCloudinary, deleteImageFromCloudinary } from "../../utils/sendImageToCloudinary";

const createUser = async (payload: TUser) => {
  const user = await UserModel.findOne({ email: payload.email });

  if (user) throw new AppError(httpStatus.CONFLICT, "User Already Exist");

  const result = await UserModel.create(payload);
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
  // Fetch existing user data
  const user = await validateUserAndStatus(userId);
  return user;
};

const updateUser = async (userId: string, payload: Partial<TUser>, file?: Express.Multer.File) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    let modifiedFieldspdata: Record<string, string | undefined> = {};
    let modifiedArrayData: Record<string, any[]> = {};

    // Handle photo upload if file is provided
    if (file) {
      const uploadedImage = await sendImageToCloudinary(
        `user-${userId}-${Date.now()}`,
        file.path
      );
      modifiedFieldspdata.photo = (uploadedImage as any).secure_url;
      modifiedFieldspdata.photoPublicId = (uploadedImage as any).public_id;

      // Delete old photo from Cloudinary if it exists
      if (existingUserData.photoPublicId) {
        await deleteImageFromCloudinary(existingUserData.photoPublicId);
      }
    }

    // Handle socialMedia updates dynamically
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
    return result;
  } catch (error) {
    await session.abortTransaction();
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

    // Soft delete by setting isDeleted flag
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
