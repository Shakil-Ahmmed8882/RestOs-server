import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../error/app.error";
import { TUser } from "./user.interface";
import UserModel from "./user.model";

const createUser = async (payload: TUser) => {
  const user = await UserModel.findOne({ email: payload.email });

  if (user) throw new AppError(httpStatus.CONFLICT, "User Already Exist");

  const result = await UserModel.create(payload);
  return result;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const result = new QueryBuilder(UserModel.find(), query).search(["foodName"]);
  return await result.modelQuery;
};

export const userServices = {
  createUser,
  getAllUsers,
};
