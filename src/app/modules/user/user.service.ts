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
  ]);
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

const updateUser = async (userId: string, payload: Partial<TUser>) => {
  // Fetch existing user data
  const existingUserData = await UserModel.findById(userId);
  if (!existingUserData) {
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

  // Initialize modified fields for socialMedia and arrays
  let modifiedFieldspdata: Record<string, string | undefined> = {};
  let modifiedArrayData: Record<string, any[]> = {};

  // Handle socialMedia updates dynamically
  if (socialMedia && Object.keys(socialMedia).length > 0) {
    for (const [key, value] of Object.entries(socialMedia)) {
      modifiedFieldspdata[`socialMedia.${key}`] = value;
    }
  }

  // Use the helper function for socialMedia updates
  updateNestedFields("socialMedia", socialMedia, modifiedFieldspdata);

  // Use the helper function for each array field
  updateArrayField("cuisinePreferences", cuisinePreferences, modifiedArrayData);

  updateArrayField(
    "favoriteRestaurants",
    favoriteRestaurants,
    modifiedArrayData
  );
  updateArrayField(
    "dietaryRestrictions",
    dietaryRestrictions,
    modifiedArrayData
  );
  updateArrayField("preferredMealTimes", preferredMealTimes, modifiedArrayData);
  updateArrayField("paymentMethods", paymentMethods, modifiedArrayData);

  // Combine direct values, socialMedia updates, and array replacements into one update object
  const result = await UserModel.updateOne(
    { _id: userId },
    {
      ...rest,
      ...modifiedFieldspdata,
      ...modifiedArrayData,
    },
    { runValidators: true, new: true }
  );

  return result;
};




const deleteUser = async (userId: string) => {
  // Fetch existing user data
  const user = await UserModel.findByIdAndDelete(userId)
  return user;
};


export const userServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser
};
