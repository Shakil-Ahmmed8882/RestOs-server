import mongoose, { Schema } from "mongoose";
import { TUser } from "./user.interface";

// Mongoose schema for Review
const userSchema = new Schema<TUser>({
  name: String,
  email: String,
  photo: String,
  role: String,
  orders: Array,
});

// Mongoose model for FoodData

const UserModel = mongoose.model<TUser>("User", userSchema);

export default UserModel;
