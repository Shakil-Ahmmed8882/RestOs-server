

import mongoose from 'mongoose';
import { IComment } from './comment.interface';

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    replies: [replySchema], 
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

export const Comment =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);
