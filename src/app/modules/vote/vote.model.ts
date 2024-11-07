import mongoose, { Schema } from 'mongoose';
import { IVote } from './vote.interface';

const voteSchema = new Schema<IVote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blog: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    voteType: {
      type: String,
      enum: ["upvote", "downvote"],  
      required: true,
    },
  },
  { timestamps: true }
);

// Add indexes for optimized queries
// voteSchema.index({ userId: 1, blogId: 1 });
// voteSchema.index({ blogId: 1, voteType: 1 }); 

export const Vote =  mongoose.models.Vote ||  mongoose.model<IVote>('Vote', voteSchema);
