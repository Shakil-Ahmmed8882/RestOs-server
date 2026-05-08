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
  status: { type: String, required: false, default: "available" },
  foodImage: { type: String, required: true },
  foodCategory: { type: String, required: true },
  price: { type: Number, required: true },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  orders: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  made_by: { type: String, required: true },
  food_origin: { type: String, required: true },
  description: { type: String, required: true },
  isVeg: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  preparationTime: { type: Number, default: 15 },
  reviews: { type: [reviewSchema], default: [] },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  cuisine: { type: String, default: "" },
  popularity: { type: Number, default: 0 },
  bestseller: { type: Boolean, default: false },
},
{ timestamps: true });

foodDataSchema.pre("save", function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const sum = (this.reviews as any[]).reduce((acc, review) => acc + (review.rating || 0), 0);
    this.averageRating = sum / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});


foodDataSchema.index({ foodName: 1, foodCategory: 1 });
foodDataSchema.index({ averageRating: -1 });
foodDataSchema.index({ preparationTime: 1 });
foodDataSchema.index({ price: 1 });
foodDataSchema.index({ isVeg: 1 });
foodDataSchema.index({ bestseller: 1 });
foodDataSchema.index({ discountPercent: -1 });

const FoodModel = mongoose.model<TFoodData>("Food", foodDataSchema);

export default FoodModel;
