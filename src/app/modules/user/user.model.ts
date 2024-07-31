import mongoose, { Schema } from "mongoose";
import { TUser } from "./user.interface";

// Mongoose schema for Review
const userSchema = new Schema<TUser>({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
  },
});

// Mongoose model for FoodData

const UserModel = mongoose.model<TUser>("User", userSchema);

export default UserModel;
