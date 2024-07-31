import QueryBuilder from "../../builder/QueryBuilder";
import { TUser } from "./user.interface";
import UserModel from "./user.model";

const createUser = async (payload: TUser) => {
  const user = await UserModel.findOne({ email: payload.email });

  if (user) return;

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
