import mongoose, { Schema, Document } from "mongoose";
import { TFoodData, TReview } from "./food.interface";

// Mongoose schema for Review
const reviewSchema = new Schema<TReview>({
  customer_name: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, required: true },
  comment: { type: String, required: true },
  date: { type: String, required: true },
});

// Mongoose schema for FoodData
const foodDataSchema = new Schema<TFoodData>({
  foodName: { type: String, required: true },
  status: { type: String,required:false, default:"available" }, 
  foodImage: { type: String, required: true },
  foodCategory: { type: String, required: true },
  price: { type: Number, required: true },
  orders: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  made_by: { type: String, required: true },
  food_origin: { type: String, required: true },
  description: { type: String, required: true },
  reviews: { type: [reviewSchema], default:[] },
});

// Mongoose model for FoodData

const FoodModel = mongoose.model<TFoodData>("Food", foodDataSchema);

export default FoodModel;
