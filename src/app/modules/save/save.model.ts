import mongoose, { Schema } from "mongoose";
import { ISave } from "./save.interface";

const saveSchema = new Schema<ISave>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["blog", "food"],
      required: true,
      index: true,
    },
    item: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      // refPath would be ideal, but we keep it explicit because the legacy
      // `blog` field used a fixed `ref: "Blog"`. We populate manually in the
      // service based on `type` so we don't have to migrate old data.
    },
    name: { type: String, required: true },

    // Legacy — kept on the schema so existing documents still load, but
    // never written by new code paths.
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: false,
    },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicates: a user can save the same item once per type
saveSchema.index({ user: 1, type: 1, item: 1 }, { unique: true });

export const Save =
  mongoose.models.Save || mongoose.model<ISave>("Save", saveSchema);
