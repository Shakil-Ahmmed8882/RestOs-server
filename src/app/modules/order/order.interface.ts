import { Schema } from "mongoose";

// Type for Order model
export type TOrder = {
  _id: string;
  food: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  foodName: string,
  price: number,
  totalPrice: number,
  status: string;
  quantity: number;
};
