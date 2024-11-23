// user.model.ts
import mongoose, { Schema } from "mongoose";
import { TUser } from "./user.interface";
import { USER_ROLE, USER_STATUS } from "../../constants";

const userSchema = new Schema<TUser>({
  name: { type: String, required:true },  
  password: { type: String, required:true },  
  email: { type: String, unique: true, required:true },  
  photo: { type: String, required:true }, 
  role: {
    type: String,
    enum: [USER_ROLE.ADMIN, USER_ROLE.USER],
    default: USER_ROLE.USER  
  },
  status: {
    type: String,
    enum: [USER_STATUS.ACTIVE, USER_STATUS.BLOCKED],
    default: USER_STATUS.ACTIVE  
  },
  bio: {
    type: String,
    default: "Share a bit about your favorite cuisines, dining habits, or dietary preferences."  // Default text
  },
  location: { type: String, default: "" },  
  cuisinePreferences: [{ type: String, default: [] }],  
  favoriteRestaurants: [{ type: String, default: [] }], 
  dietaryRestrictions: [{ type: String, default: [] }], 
  contactNumber: { type: String, default: "" },
  socialMedia: {
    instagram: { type: String, default: "" },  
    facebook: { type: String, default: "" },   
    twitter: { type: String, default: "" }     
  },
  diningFrequency: {
    type: String,
    enum: ["Occasionally", "Frequently", "Rarely"],
    default: "Rarely"  
  },
  preferredMealTimes: [{
    type: String,
    enum: ["Breakfast", "Lunch", "Dinner"],
    default: ["Lunch"]  
  }],
  paymentMethods: [{
    type: String,
    enum: ["Cash", "Credit Card", "Digital Wallet"],
    default: ["Cash"]  
  }]
});

const UserModel = mongoose.model<TUser>("User", userSchema);

export default UserModel;
