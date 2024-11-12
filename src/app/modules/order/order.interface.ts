import { Schema } from "mongoose";

// Type for Order model
export type TOrder = {
  _id: string;
  food: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  status: string;
  quantity: number;
  totalPrice: number;
};
