import mongoose, { Schema, Document } from "mongoose";
import { TOrderFood } from "./order.interface";

// Create the FoodItem schema
const FoodItemSchema: Schema = new Schema(
  {
    foodId: { type: String, required: true },
    foodName: { type: String, required: true },
    status: { type: String, required: true, default: "pending" },
    foodImage: { type: String, required: true },
    price: { type: Number, required: true },
    made_by: { type: String, required: true },
    email: { type: String },
  },
  { timestamps: true }
);

// Create the Mongoose model 
const OrdersModel = mongoose.model<TOrderFood>("Orders", FoodItemSchema);

export default OrdersModel;
