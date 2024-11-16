import mongoose, { Schema, Document } from "mongoose";
import { TFoodCategory } from "./foodCategory.interface";

// Mongoose schema for FoodCategory
const foodCategorySchema = new Schema<TFoodCategory>({
  name: { type: String, required: true, unique: true }, 
  description: { type: String }, 
  image: { type: String }, 
  createdAt: { type: Date, default: Date.now }, 
  updatedAt: { type: Date, default: Date.now }, 
});

// Middleware to update `updated_at` on save
foodCategorySchema.pre("save", function (next) {
  this.updatedAt= new Date();
  next();
});

// Mongoose model for FoodCategory
const FoodCategoryModel = mongoose.model<TFoodCategory>(
  "FoodCategory",
  foodCategorySchema
);

export default FoodCategoryModel;
