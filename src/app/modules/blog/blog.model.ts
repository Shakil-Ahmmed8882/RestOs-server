import mongoose, { Schema, Document } from "mongoose";
import { IBlog } from "./blog.interface";

// Mongoose schema for Blog
const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], required: true },
  instructions: { type: [String], required: true },
  image: { type: String, required: true },
  author: {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "test-approved"],
    default: "pending",
  },
  isDeleted: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Mongoose model for Blog
const BlogModel = mongoose.model<IBlog>("Blog", blogSchema);

export default BlogModel;
