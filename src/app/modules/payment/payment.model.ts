import mongoose, { Schema } from "mongoose";
import { TPayment } from "./payment.interface";

const PaymentSchema: Schema<TPayment> = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
      required: true,
    },
    orderIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Orders" }],
      default: [],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "sslcommerz",
    },
    sslcommerzResponse: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const PaymentModel = mongoose.model<TPayment>("Payment", PaymentSchema);

export default PaymentModel;
