import httpStatus from "http-status";
import UserModel from "../modules/user/user.model";
import AppError from "../errors/AppError";
import { USER_STATUS } from "../constants";
import { TUser } from "../modules/user/user.interface";

/**
 * Helper function to check if the user exists and is not blocked
 * @param userId - User ID
 * @returns Promise<void>
 */
const validateUserStatus = async (userId: string): Promise<TUser> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Oops! This user is BLOCKED!");
  }

  return user;
};

export default validateUserStatus;
