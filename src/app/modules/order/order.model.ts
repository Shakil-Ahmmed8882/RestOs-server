import mongoose, { Schema } from "mongoose";
import { TOrder } from "./order.interface";

// Define the Order schema with references to Food and User models
const OrderSchema: Schema<TOrder> = new Schema(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "canceled"], 
      default: "pending", 
      required: true 
    },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

// Create the Mongoose model
const OrdersModel = mongoose.model<TOrder>("Orders", OrderSchema);

export default OrdersModel;
