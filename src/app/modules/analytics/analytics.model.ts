// analytics.model.ts
import mongoose, { Schema } from 'mongoose';
import { IAnalytics } from './analytics.interface';

const analyticsSchema = new Schema<IAnalytics>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',           
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',           
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['view', 'upvote', 'downvote', 'comment',"post"],  
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,      
    },
  },
  { timestamps: true },      
);

// Export the Analytics model
export const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', analyticsSchema);