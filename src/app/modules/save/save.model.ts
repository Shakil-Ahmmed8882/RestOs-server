import mongoose, { Schema } from "mongoose";
import { ISave } from "./save.interface";

const saveSchema = new Schema<ISave>(
  {
    name: String,
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Export the Save model
export const Save =
  mongoose.models.Save || mongoose.model<ISave>("Save", saveSchema);
