import mongoose, { Schema } from "mongoose";
import { TUser } from "./user.interface";
import { USER_ROLE, USER_STATUS } from "../../constants";


const userSchema = new Schema<TUser>({
  name: String,
  password: String,
  email: String,
  photo: String,
  role: {
    type: String, 
    required: true,
    enum: [USER_ROLE.ADMIN, USER_ROLE.USER]
  },
  status: {
    type: String,
    required: true,
    enum: [USER_STATUS.ACTIVE, USER_STATUS.BLOCKED], 
    default: USER_STATUS.ACTIVE,
  }
  
});

const UserModel = mongoose.model<TUser>("User", userSchema);

export default UserModel;
